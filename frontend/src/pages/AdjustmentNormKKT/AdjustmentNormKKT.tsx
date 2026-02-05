import React, { useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { AdjustmentNormInputType, AdjustmentNormOutputType } from "../../types";
import {
  Add,
  Delete,
  Edit,
  Visibility,
  ArrowDropDown,
  FileDownload,
  FileUpload,
  FilterList,
  Print,
  Mail,
  Search,
} from "@mui/icons-material";
import AdjustmentNormKCTModal from "./AdjustmentNormKKTModal/AdjustmentNormKKTModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table as AntTable, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import AdjustmentNormService from "../../service/AdjustmentNormService";
import { parseAxiosError } from "../../utils/handleApiError";
import { AdjustmentNormType } from "../../enum";
import { ShowAlertImport } from "../../utils/AlertImport";
import { formatDecimal } from "../../utils/helpers";

export default function AdjustmentNormKKT() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  // Fetch all data without search parameter to handle filtering locally
  const {
    data: adjustmentnorms = {},
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["adjustmentnorms", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/adjustmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=${AdjustmentNormType.CKKT}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const handleToggleExpand = (adjustmentnorm: AdjustmentNormOutputType) => {
    const id = adjustmentnorm?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const createMutation = useMutation({
    mutationFn: (newAdjustmentNorm: Partial<AdjustmentNormInputType>) =>
      api.post("/adjustmentnorms", newAdjustmentNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Lỗi không xác định";
      console.error("Create error:", errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateAdjustmentNorm: Partial<AdjustmentNormInputType>) =>
      api
        .put(
          `/adjustmentnorms/${updateAdjustmentNorm._id}`,
          updateAdjustmentNorm,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Lỗi không xác định";
      console.error("Update error:", errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      AdjustmentNormService.importFile(formData, AdjustmentNormType.CKKT),
    onMutate: () => {
      // setIsUploading(true);
      // setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      // setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      // setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: () => AdjustmentNormService.exportFile(AdjustmentNormType.CKKT),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/adjustmentnorms/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      showSuccessAlert("Xóa thành công");
      setSelectedItems([]);
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
    if (selectedItems.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        selectedItems.forEach((id) => {
          if (typeof id === "string") {
            deleteMutation.mutate(id);
          }
        });
      }
    });
  };

  const handleSubmit = (values: Partial<AdjustmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (adjustmentNorm?: AdjustmentNormOutputType) => {
    if (adjustmentNorm) {
      setSelected(adjustmentNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<AdjustmentNormOutputType>["columns"] = [
    {
      title: <Typography sx={{ fontWeight: "bold" }}>STT</Typography>,
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã định mức giao khoán
        </Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_, record) => <Typography>{record.code}</Typography>,
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      width: 80,
      render: (_, record) => (
        <IconButton onClick={() => handleToggleExpand(record)}>
          <Visibility color="secondary" />
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "edit",
      width: 50,
      render: (_, record) => (
        <IconButton onClick={() => handleOpen(record)}>
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<AdjustmentNormOutputType> = {
    selectedRowKeys: selectedItems,
    onChange: (newSelectedItems: React.Key[]) => {
      setSelectedItems(newSelectedItems);
    },
  };

  const expandedRowRender = (record: AdjustmentNormOutputType) => (
    <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
      <TableContainer>
        <Table
          sx={{
            "& td, & th": { border: 0 },
          }}
        >
          <TableBody>
            {/* Hàng thông tin chung */}
            <TableRow sx={{ height: 28 }}>
              <TableCell colSpan={3} sx={{ fontWeight: "bold", py: 0.5 }}>
                Độ cứng của đá lẫn trong gương
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ py: 0.5 }}>
                {record.hardness?.name || "-"}
              </TableCell>
            </TableRow>

            <TableRow sx={{ height: 28 }}>
              <TableCell colSpan={3} sx={{ fontWeight: "bold", py: 0.5 }}>
                Tỉ lệ đá lẫn trong gương (Ckẹp)
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ py: 0.5 }}>
                {record.rockRatio?.name || "-"}
              </TableCell>
            </TableRow>
          </TableBody>

          {/* Phần bảng dữ liệu norms nền trắng */}
          <TableBody sx={{ backgroundColor: "#fff" }}>
            {record.norms?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell align="center" sx={{ width: "5%" }}>
                  {index + 1}
                </TableCell>
                <TableCell align="center" sx={{ width: "20%" }}>
                  {item.assignmentCode?.code}
                </TableCell>
                <TableCell sx={{ width: "55%" }}>
                  {item.assignmentCode?.name}
                </TableCell>
                <TableCell align="center" sx={{ width: "10%" }}>
                  {item.assignmentCode?.uom?.name || ""}
                </TableCell>
                <TableCell align="center" sx={{ width: "10%" }}>
                  {formatDecimal(item.norm)}
                </TableCell>
              </TableRow>
            ))}

            {(!record.norms || record.norms.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  endIcon={<Add />}
                  onClick={() => handleOpen()}
                  sx={{
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_add_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_add_button.dark,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Tạo mới
                </Button>
                <Button
                  variant="contained"
                  endIcon={<Delete />}
                  onClick={handleDelete}
                  sx={{
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_delete_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_delete_button.dark,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                  disabled={
                    selectedItems.length === 0 || deleteMutation.isPending
                  }
                >
                  {deleteMutation.isPending
                    ? "Đang xóa..."
                    : `Xóa (${selectedItems.length})`}
                </Button>
              </Box>
              <Box display={"flex"} flex={1} gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FilterList />}
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.dark,
                      boxShadow:
                        custom_theme.customShadows.tableFunctionalHover,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Lọc
                </Button>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm theo mã định mức, độ cứng, tỷ lệ đá, mã giao khoán..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  sx={{
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_filter_box.main,
                    "& .MuiInputBase-root": {
                      fontSize: "14px",
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {searchValue && (
                          <IconButton
                            onClick={handleClearSearch}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            ×
                          </IconButton>
                        )}
                        {isLoading && searchValue ? (
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : (
                          <Search sx={{ fontSize: 24 }} />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box display={"flex"} gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileUpload />}
                  onClick={handleUploadClick}
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.dark,
                      boxShadow:
                        custom_theme.customShadows.tableFunctionalHover,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Tải lên
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileDownload />}
                  onClick={() => exportExcel.mutate()}
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.dark,
                      boxShadow:
                        custom_theme.customShadows.tableFunctionalHover,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xuất file
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Print />}
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.dark,
                      boxShadow:
                        custom_theme.customShadows.tableFunctionalHover,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  In
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Mail />}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.dark,
                      boxShadow:
                        custom_theme.customShadows.tableFunctionalHover,
                    },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Enhanced Search Results Info with Loading State */}
          {searchValue && (
            <Box
              sx={{ mb: 2, p: 1, backgroundColor: "#f0f7ff", borderRadius: 1 }}
            >
              <Typography variant="body2" color="primary">
                {isLoading && searchValue ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Đang tìm kiếm "{searchValue}"...
                  </Box>
                ) : (
                  <>
                    Tìm thấy {adjustmentnorms.totalDocs} kết quả cho "
                    {searchValue}"
                    {adjustmentnorms.totalDocs > 0 && (
                      <Button
                        size="small"
                        onClick={handleClearSearch}
                        sx={{ ml: 2 }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </>
                )}
              </Typography>
            </Box>
          )}

          <CustomTable<AdjustmentNormOutputType>
            data={adjustmentnorms.data}
            total={adjustmentnorms.totalDocs}
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
            }}
          />
        </Box>
      </Box>
      <AdjustmentNormKCTModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const formData = new FormData();
            formData.append("file", file);
            importFile.mutate(formData);
          }
          e.target.value = "";
        }}
      />
    </Box>
  );
}
