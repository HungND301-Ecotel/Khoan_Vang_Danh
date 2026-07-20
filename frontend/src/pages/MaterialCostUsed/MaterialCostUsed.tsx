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
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  MaterialCostUsedInputType,
  MaterialCostUsedOutputType,
} from "../../types";
import MaterialCostUsedModal from "./MaterialCostUsedModal/MaterialCostUsedModal";
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
import GroupTable from "./GroupTable";
import MonthTable from "./MonthTable";
import dayjs from "dayjs";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function MaterialCostUsed() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<MaterialCostUsedOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<MaterialCostUsedInputType>
  >(setOpen, "Chi phí vật tư thực hiện");

  const queryClient = useQueryClient();

  const { data: materialcostuseds = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["materialcostuseds", searchValue, page, limit],
      queryFn: async () => {
        try {
          const res = await api.get(
            `/materialcostuseds?q=${searchValue}&page=${page}&limit=${limit}`,
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
    mutationFn: (
      newMaterialCostUsed: Partial<MaterialCostUsedInputType> & {
        isOtherTask?: boolean;
      },
    ) => {
      const endpoint = newMaterialCostUsed.isOtherTask
        ? "/othermaterialcosts"
        : "/materialcostuseds";
      return api.post(endpoint, newMaterialCostUsed).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
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
      updateMaterialCostUsed: Partial<MaterialCostUsedInputType> & {
        isOtherTask?: boolean;
      },
    ) => {
      const endpoint = updateMaterialCostUsed.isOtherTask
        ? `/othermaterialcosts/${updateMaterialCostUsed._id}`
        : `/materialcostuseds/${updateMaterialCostUsed._id}`;
      return api.put(endpoint, updateMaterialCostUsed).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
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
    if (selectedRows.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation({ ids: selectedRows });
      }
    });
  };

  const { mutate: deleteMutation, isPending: isDeletePending } = useMutation({
    mutationFn: async ({ ids }: { ids: React.Key[] }) => {
      return api
        .delete(`/materialcostuseds/department`, {
          data: { departmentIds: ids },
        })
        .then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
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

  const handleSubmit = (values: MaterialCostUsedInputType[]) => {
    if (values[0]._id) {
      updateMutation.mutate(values[0]);
    } else {
      createMutation.mutate(values[0]);
    }
  };

  const handleOpen = (materialCostUsed?: any) => {
    if (materialCostUsed) {
      setSelected(materialCostUsed);
    } else {
      setSelected(null);
      clearMinimize();
    }
    setOpen(true);
  };

  const handleView = (initialplannedcost: MaterialCostUsedOutputType) => {
    const id = initialplannedcost?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: MaterialCostUsedOutputType) => (
    <Box>
      <MonthTable department={record.department} handleOpen={handleOpen} />
    </Box>
  );

  const columns: TableProps<MaterialCostUsedOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Phân xưởng </Typography>,
      dataIndex: "department",
      key: "department",
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
      dataIndex: "totalUsedCost",
      key: "totalUsedCost",
      width: 50,
      render: (text: string, item: any) => {
        const total = item.totalUsedCost || 0;
        return <Typography> {formattedPrice(total)}</Typography>;
      },
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      key: "view",
      width: 80,
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

  const rowSelection: TableRowSelection<MaterialCostUsedOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
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
        <Typography>Chi phí vật tư thực hiện </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Chi phí vật tư thực hiện
            </Typography>
            <PageAction
              selectedIds={selectedRows}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={materialcostuseds.totalDocs}
            />
          </Box>
          <CustomTable<MaterialCostUsedOutputType>
            data={materialcostuseds.data}
            total={materialcostuseds.totalDocs}
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
      <MaterialCostUsedModal
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
