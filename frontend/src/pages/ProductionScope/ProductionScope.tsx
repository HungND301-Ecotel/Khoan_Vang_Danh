import React, { useState, useRef } from "react";
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
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  ProductionScopeInputType,
  ProductionScopeOutputType,
} from "../../types";
import ProductionScopeModal from "./ProductionScopeModal/ProductionScopeModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import ProductionScopeService from "../../service/ProductionScopeService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function ProductScope() {
  const [selected, setSelected] = useState<ProductionScopeOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: productionscopes = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["productionscopes", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/productionscopes?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data || [];
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<ProductionScopeInputType>) =>
      api.post("/productionscopes", newExcavationNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<ProductionScopeInputType>) =>
      api
        .put(
          `/productionscopes/${updateExcavationNorm._id}`,
          updateExcavationNorm,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
      setOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      ProductionScopeService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: ProductionScopeService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedRows);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: React.Key[]) =>
      api
        .delete(`/productionscopes`, { data: { ids } })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      console.error(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const handleSubmit = (values: Partial<ProductionScopeInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (excavationNorm?: ProductionScopeOutputType) => {
    if (excavationNorm) {
      setSelected(excavationNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  // Main columns
  const columns: TableProps<ProductionScopeOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_value, _record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Mã diện sản xuất</Typography>
      ),
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (_, record) => <Typography>{record.code}</Typography>,
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên diện sản xuất</Typography>
      ),
      dataIndex: "name",
      key: "name",
      render: (_, record) => <Typography>{record.name}</Typography>,
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "edit",
      key: "edit",
      width: 80,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() => handleOpen(record)}
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<ProductionScopeOutputType> = {
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
        <Typography>Danh mục</Typography>
        <Typography>Diện sản xuất</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Diện sản xuất
            </Typography>
            <PageAction
              selectedIds={selectedRows}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={productionscopes.totalDocs}
            />
          </Box>

          <CustomTable<ProductionScopeOutputType>
            data={productionscopes.data}
            total={productionscopes.totalDocs}
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
          />
        </Box>
      </Box>
      <ProductionScopeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}
