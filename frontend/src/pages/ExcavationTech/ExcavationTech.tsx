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
import ExcavationTechModal from "./ExcavationTechModal/ExcavationTechModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExcavationTechType } from "../../types";
import api from "../../config/api.config";
import ExcavationTechService from "../../service/ExcavationTechService";
import { parseAxiosError } from "../../utils/handleApiError";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import {ShowAlertImport } from "../../utils/AlertImport"

export default function ExcavationTech() {
  const [open, setOpen] = useState(false);
  const [selectedExcavationTech, setSelectedExcavationTech] =
    useState<ExcavationTechType | null>(null);
  const [selectedExcavationTechs, setSelectedExcavationTechs] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: excavationtechs = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["excavationtechs", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/excavationtechs?q=${searchValue}&page=${page}&limit=${limit}`
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      ExcavationTechService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setIsUploading(false);
      ShowAlertImport(data)
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: ExcavationTechService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (newExcavationTech: Partial<ExcavationTechType>) =>
      api.post("/excavationtechs", newExcavationTech).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateExcavationTech: Partial<ExcavationTechType>) =>
      api
        .put(
          `/excavationtechs/${updateExcavationTech._id}`,
          updateExcavationTech
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setOpen(false);
      setSelectedExcavationTech(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
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
    if (selectedExcavationTechs.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedExcavationTechs.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedExcavationTechs.map((id) =>
          api.delete(`/excavationtechs/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
            setSelectedExcavationTechs([]);
            showSuccessAlert(
              `Đã xóa ${selectedExcavationTechs.length} bản ghi thành công`
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
      api.delete(`/excavationtechs/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<ExcavationTechType>) => {
    if (selectedExcavationTech) {
      updateMutation.mutate({ ...values, _id: selectedExcavationTech._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (ExcavationTech?: ExcavationTechType) => {
    if (ExcavationTech) {
      setSelectedExcavationTech(ExcavationTech);
    } else {
      setSelectedExcavationTech(null);
    }
    setOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<ExcavationTechType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Công nghệ xúc</Typography>,
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Typography>{record.name}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
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

  const rowSelection: TableRowSelection<ExcavationTechType> = {
    selectedRowKeys: selectedExcavationTechs,
    onChange: (newSelectedExcavationTechs: React.Key[]) => {
      setSelectedExcavationTechs(newSelectedExcavationTechs);
    },
  };

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
                  onClick={handleDeleteMultiple}
                  disabled={selectedExcavationTechs.length === 0}
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
                  Xóa ({selectedExcavationTechs.length})
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
                  placeholder="Tìm kiếm theo tên công nghệ xúc..."
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
                    Tìm thấy {excavationtechs.totalDocs} kết quả cho "
                    {searchValue}"
                    {excavationtechs.totalDocs > 0 && (
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

          <CustomTable<ExcavationTechType>
            data={excavationtechs.data}
            total={excavationtechs.totalDocs}
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
      <ExcavationTechModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedExcavationTech={selectedExcavationTech}
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
