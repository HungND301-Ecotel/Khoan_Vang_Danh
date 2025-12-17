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
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import React, { useState, useMemo, useEffect, useRef } from "react";
import MaterialAssignmentModal from "./MaterialAssignmentModal/MaterialAssignment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MaterialAssignmentInputType,
  MaterialAssignmentOutputType,
  Materials,
} from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import LoadingSkeleton from "../../ui/LoadingSkeleton";
import EmptyState from "../../ui/EmptyState";
import CustomTable from "../../components/CustomTable/CustomTable";
import MaterialAssignmentService from "../../service/MaterialAssignmentService";
import { parseAxiosError } from "../../utils/handleApiError";

export default function MaterialAssignment() {
  const [open, setOpen] = useState(false);
  const [selectedMaterialAssignment, setSelectedMaterialAssignment] =
    useState<Materials | null>(null);
  const [selectedMaterialAssignments, setSelectedMaterialAssignments] =
    useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const {
    data: materialAssignments = {
      totalDocs: 0,
      results: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["materialAssignments", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/materialAssignments?q=${searchValue}&page=${page}&limit=${limit}&type=in`
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
      api
        .post("/materialassignments", newMaterialAssignment)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (
      updateMaterialAssignment: Partial<MaterialAssignmentInputType>
    ) =>
      api
        .put(
          `/materialassignments/${updateMaterialAssignment._id}`,
          updateMaterialAssignment
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setOpen(false);
      setSelectedMaterialAssignment(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDelete = (id?: string) => {
    if (!id) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleDeleteMultiple = () => {
    if (selectedMaterialAssignments.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMaterialAssignments.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedMaterialAssignments.map((id) =>
          api.delete(`/materialassignments/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ["materialAssignments"],
            });
            setSelectedMaterialAssignments([]);
            showSuccessAlert(
              `Đã xóa ${selectedMaterialAssignments.length} bản ghi thành công`
            );
          })
          .catch((error) => {
            console.error("Lỗi khi xóa:", error);
            showErrorAlert("Có lỗi xảy ra khi xóa các bản ghi");
          });
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/materialassignments/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MaterialAssignmentInputType>) => {
    if (selectedMaterialAssignment) {
      updateMutation.mutate({ ...values, _id: selectedMaterialAssignment._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MaterialAssignment?: Materials) => {
    if (MaterialAssignment) {
      setSelectedMaterialAssignment(MaterialAssignment);
    } else {
      setSelectedMaterialAssignment(null);
    }
    setOpen(true);
  };

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      MaterialAssignmentService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setIsUploading(false);
      showSuccessAlert("Import thành công!");
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: MaterialAssignmentService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const columns: TableProps<Materials>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
      dataIndex: "assignmentCode",
      key: "assignmentCode",
      width: 200,
      render: (_, record) => (
        <Typography >
          {record.assignmentCode?.code}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.assignmentCode?.code ?? "").localeCompare(
          b.assignmentCode?.code ?? "",
          "vi",
          { sensitivity: "base" }
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (_, record) => (
        <Typography >{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên vật tư</Typography>,
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <Typography >{value}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "uom",
      key: "uom",
      render: (_, record) => (
        <Typography >{record.uom?.name}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
      dataIndex: "quantity",
      key: "quantity",
      render: (_, record) => (
        <Typography >
          {record.quantity ? record.quantity.toLocaleString() : ""}
        </Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <Typography >
          {record.currentPrice ? record.currentPrice.toLocaleString() : ""}
        </Typography>
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

  const rowSelection: TableRowSelection<Materials> = {
    selectedRowKeys: selectedMaterialAssignments,
    onChange: (newSelectedMaterialAssignments: React.Key[]) => {
      setSelectedMaterialAssignments(newSelectedMaterialAssignments);
    },
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };
  // Show loading skeleton on initial load
  // if (isLoading) {
  //   return (
  //     <Box>
  //       <Box mt={3}>
  //         <LoadingSkeleton />
  //       </Box>
  //     </Box>
  //   );
  // }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    // Gọi trực tiếp click() trên phần tử input bị ẩn
    fileInputRef.current?.click();
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
        <Typography>Vật tư tài sản</Typography>
        <Typography>Vật tư tài sản trong khoán</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Vật tư tài sản trong khoán
            </Typography>
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
                  onClick={handleDeleteMultiple}
                  disabled={selectedMaterialAssignments.length === 0}
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
                >
                  {deleteMutation.isPending
                    ? "Đang xóa..."
                    : `Xóa (${selectedMaterialAssignments.length})`}
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
                  placeholder="Tìm kiếm theo mã vật tư hoặc tên vật tư..."
                  onChange={(e) => setSearchValue(e.target.value)}
                  value={searchValue}
                  sx={{
                    backgroundColor: (theme) =>
                      custom_theme.palette.table_filter_box.main,
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
                        {isLoading && searchValue !== "" ? (
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
                <input
                  ref={fileInputRef}
                  id="upload-excel"
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
                  onClick={() => exportExcel.mutate("in")}
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
                {isLoading && searchValue !== "" ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Đang tìm kiếm "{searchValue}"...
                  </Box>
                ) : (
                  <>
                    Tìm thấy {materialAssignments.totalDocs} kết quả cho "
                    {searchValue}"
                    {materialAssignments.totalDocs > 0 && (
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
          <CustomTable<Materials>
            data={materialAssignments.data}
            total={materialAssignments.totalDocs}
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
      <MaterialAssignmentModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedMaterialAssignment={selectedMaterialAssignment}
      />
    </Box>
  );
}
