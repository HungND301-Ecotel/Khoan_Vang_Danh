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
  InitialPlannedCostOutputType,
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
import InitialPlannedCostModal from "./InitialPlannedCostModal/InitialPlannedCostModal";
import PhaseTable from "./PhaseTable";
import dayjs from "dayjs";
import GroupTable from "./GroupTable";
import MonthTable from "./MonthTable";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";
export default function InitialPlannedCosts() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});
  const [deletedIds, setDeletedIds] = useState<React.Key[]>([]);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<InitialPlannedCostInputType>
  >(setOpen, "Chi phí kế hoạch ban đầu");

  const queryClient = useQueryClient();

  const { data: initialplannedcosts = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["initialplannedcosts", searchValue, page, limit],
      queryFn: async () => {
        try {
          const res = await api.get(
            `/initialplannedcosts?q=${searchValue}&page=${page}&limit=${limit}`,
          );
          return res.data?.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Lỗi khi tải dữ liệu";
          showErrorAlert(errorMessage);
        }
      },
    });

  const createMutation = useMutation({
    mutationFn: (newInitialPlannedCost: Partial<InitialPlannedCostInputType>) =>
      api
        .post("/initialplannedcosts", newInitialPlannedCost)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initialplannedcosts"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Lỗi khi thêm mới";
      console.log(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (
      updateInitialPlannedCost: Partial<InitialPlannedCostInputType>,
    ) =>
      api
        .put(
          `/initialplannedcosts/${updateInitialPlannedCost._id}`,
          updateInitialPlannedCost,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initialplannedcosts"] });
      setOpen(false);
      setSelected(null);
      clearMinimize();
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật";
      console.log(errorMessage);
      showErrorAlert(errorMessage);
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

  const { mutate: handleDeleteMutation, isPending: isDeletePending } =
    useMutation({
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

  const handleSubmit = (values: Partial<InitialPlannedCostInputType>) => {
    if (values._id) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (initialplannedcost?: any) => {
    if (initialplannedcost) {
      setSelected(initialplannedcost);
    } else {
      setSelected(null);
      clearMinimize();
    }
    setOpen(true);
  };

  const handleView = (initialplannedcost: InitialPlannedCostOutputType) => {
    const id = initialplannedcost?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: InitialPlannedCostOutputType) => {
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
          handleOpen={handleOpen}
          department={record.department}
          handleDeleteMutation={handleDeleteMutation}
        />
      </Box>
    );
  };

  const columns: TableProps<InitialPlannedCostOutputType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Phân xưởng </Typography>,
      dataIndex: "department",
      key: "department",
      width: 300,
      render: (_, record) => (
        <Typography>
          {record.department?.name || record.department?.code}
        </Typography>
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
      dataIndex: "totalInitialPlannedCost",
      key: "totalInitialPlannedCost",
      width: 50,
      render: (text: string, item: any) => {
        const total = item.totalInitialPlannedCost || 0;
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
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Thêm</Typography>,
      dataIndex: "add",
      key: "add",
      width: 50,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() =>
            handleOpen({
              department: record.department,
            })
          }
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Add />
        </IconButton>
      ),
    },
  ];

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const rowSelection: TableRowSelection<InitialPlannedCostOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);

      const selectedDocuments = initialplannedcosts.data.filter(
        (g: InitialPlannedCostOutputType) =>
          newSelectedRows.some((s) => s === g._id),
      );
      const allSelectedGroups = selectedDocuments.flatMap((g: any) =>
        g.months.flatMap((m: any) => m.scopes),
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
        <Typography>Chi phí kế hoạch ban đầu </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Chi phí kế hoạch ban đầu
            </Typography>
            <PageAction
              selectedIds={selectedRows}
              handleDelete={handleDelete}
              deleteMutation={handleDeleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={initialplannedcosts.totalDocs}
            />
          </Box>
          <CustomTable<InitialPlannedCostOutputType>
            data={initialplannedcosts.data}
            total={initialplannedcosts.totalDocs}
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
      <InitialPlannedCostModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
