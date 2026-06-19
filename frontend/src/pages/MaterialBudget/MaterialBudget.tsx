import React, { Fragment, useState } from "react";
import {
  Add,
  ArrowDropDown,
  Delete,
  Edit,
  FileDownload,
  FileUpload,
  FilterList,
  Mail,
  Print,
  Search,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Table as TableMui,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  InitialPlannedCostInputType,
  MaterialBudgetCostType,
} from "../../types";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import PhaseTable from "./PhaseTable";
import dayjs from "dayjs";
import GroupTable from "./GroupTable";
import MonthTable from "./MonthTable";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";

export default function MaterialBudget() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});
  const [deletedIds, setDeletedIds] = useState<React.Key[]>([]);

  const queryClient = useQueryClient();

  const { data: materialbudgets = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["materialbudgets", searchValue, page, limit],
      queryFn: async () => {
        try {
          const res = await api.get(
            `/materialbudgets?q=${searchValue}&page=${page}&limit=${limit}`,
          );
          return res.data?.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Lỗi khi tải dữ liệu";
          showErrorAlert(errorMessage);
        }
      },
    });

  const handleDelete = () => {
    if (deletedIds.length === 0) {
      showErrorAlert("không tìm thấy bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        handleDeleteMutation(deletedIds);
      }
    });
  };

  const { mutate: handleDeleteMutation } = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      const deletePromises = ids.map((id) =>
        api.delete(`/initialplannedcosts/${id}`).then((res) => res.data),
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initialplannedcosts"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi xóa";
      console.error(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const handleView = (materialbudget: MaterialBudgetCostType) => {
    const id = materialbudget?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: MaterialBudgetCostType) => {
    const key = record._id || "";
    const data = expandedData[key] || record;
    if (data === null) {
      return (
        <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography color="error">
            Không thể tải thông tin chi tiết. Có thể bản ghi đã bị xóa.
          </Typography>
        </Box>
      );
    }
    if (!data.months) {
      return <Box sx={{ p: 2 }}>Đang tải...</Box>;
    }
    return (
      <Box>
        <MonthTable
          data={data.months}
          department={record.department}
          handleDeleteMutation={handleDeleteMutation}
        />
      </Box>
    );
  };

  const columns: TableProps<MaterialBudgetCostType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 60,
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Phân xưởng</Typography>
      ),
      dataIndex: "department",
      key: "department",
      width: 300,
      render: (_, record) => (
        <Typography>{record.department?.name || record.department?.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.department?.name ?? "").localeCompare(
          b.department?.name ?? "",
          "vi",
          {
            sensitivity: "base",
          },
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Thời gian</Typography>,
      dataIndex: "month",
      key: "month",
      width: 350,
      render: (text: string, item: any) => <Typography>{text}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Chi phí</Typography>,
      dataIndex: "totalBudgetCost",
      key: "totalBudgetCost",
      width: 50,
      render: (text: string, item: any) => {
        const total = item?.totalBudgetCost || 0;
        return <Typography> {formattedPrice(total)}</Typography>;
      },
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      key: "view",
      width: 50,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() => handleView(record)}
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          {expandedRow === record?._id ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
  ];

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const rowSelection: TableRowSelection<MaterialBudgetCostType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);

      const selectedDocuments = materialbudgets.data.filter(
        (g: MaterialBudgetCostType) => newSelectedRows.some((s) => s === g._id),
      );
      const allSelectedGroups = selectedDocuments.flatMap((g: any) => 
        g.months.flatMap((m: any) => m.scopes)
      );
      const deletedGroupIds = allSelectedGroups.map(
        (groupItem: any) => groupItem._id,
      );
      setDeletedIds(deletedGroupIds);
    },
  };

  return (
    <Box
      sx={{
        px: 5, // horizontal = 32px
        py: 1, // vertical = 8px
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Chi phí vật tư kế hoạch </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Chi phí vật tư kế hoạch
            </Typography>
            <PageAction
              selectedIds={[]}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={materialbudgets.totalDocs}
            />
          </Box>
          <CustomTable<MaterialBudgetCostType>
            data={materialbudgets.data}
            total={materialbudgets.totalDocs}
            page={page}
            limit={limit}
            columns={columns}
            rowSelection={rowSelection}
            onPageChange={(p, ps) => {
              setPage(p);
              setLimit(ps);
            }}
            isLoading={isLoading}
            searchValue={searchValue}
            handleClearSearch={handleClearSearch}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => {
                setExpandedRow(expanded ? record._id || null : null);
              },
              expandedRowRender,
              showExpandColumn: false,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
