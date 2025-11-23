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
import React, { useState, useMemo, useEffect } from "react";
import CrossSectionModal from "../../components/CrossSectionModal/CrossSectionModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CrossSectionOutputType, CrossSectionInputType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from '../../theme';
import CustomTable from "../../components/CustomTable/CustomTable";

export default function CrossSection() {
  const [open, setOpen] = useState(false);
  const [selectedCrossSection, setSelectedCrossSection] =
    useState<CrossSectionOutputType | null>(null);
  const [selectedCrossSections, setSelectedCrossSections] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const queryClient = useQueryClient();

  const { data: crosssections = { totalDocs: 0, data: [] }, isLoading, isFetching } = useQuery({
    queryKey: ["crosssections", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(`/crosssections?q=${searchValue}&page=${page}&limit=${limit}`);
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCrossSection: Partial<CrossSectionInputType>) =>
      api.post("/crosssections", newCrossSection).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateCrossSection: Partial<CrossSectionInputType>) =>
      api
        .put(`/crosssections/${updateCrossSection._id}`, updateCrossSection)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setOpen(false);
      setSelectedCrossSection(null);
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
    if (selectedCrossSections.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedCrossSections.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedCrossSections.map((id) =>
          api.delete(`/crosssections/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["crosssections"] });
            setSelectedCrossSections([]);
            showSuccessAlert(
              `Đã xóa ${selectedCrossSections.length} bản ghi thành công`
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
      api.delete(`/crosssections/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<CrossSectionInputType>) => {
    if (selectedCrossSection) {
      updateMutation.mutate({ ...values, _id: selectedCrossSection._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (crossSection?: CrossSectionOutputType) => {
    if (crossSection) {
      setSelectedCrossSection(crossSection);
    } else {
      setSelectedCrossSection(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<CrossSectionOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{(page - 1) * limit + index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tiết diện lò xén</Typography>
      ),
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.name}</Typography>
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
      render: (_, record) => <Typography>{record.uom?.name}</Typography>,
      sorter: (a, b) =>
        (a.uom?.name ?? "").localeCompare(b.uom?.name ?? "", "vi", {
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

  const rowSelection: TableRowSelection<CrossSectionOutputType> = {
    selectedRowKeys: selectedCrossSections,
    onChange: (newSelectedCrossSections: React.Key[]) => {
      setSelectedCrossSections(newSelectedCrossSections);
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
                    backgroundColor: (theme) => custom_theme.palette.table_add_button.main,
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_add_button.dark },
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
                  disabled={selectedCrossSections.length === 0}
                  sx={{
                    backgroundColor: (theme) => custom_theme.palette.table_delete_button.main,
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_delete_button.dark },
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xóa ({selectedCrossSections.length})
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
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                      boxShadow: custom_theme.customShadows.tableFunctionalHover,
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
                  placeholder="Tìm kiếm theo tên tiết diện hoặc đơn vị tính..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  sx={{
                    backgroundColor: (theme) => custom_theme.palette.table_filter_box.main,
                    "& .MuiInputBase-root": {
                      fontSize: "14px",
                    }
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
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                      boxShadow: custom_theme.customShadows.tableFunctionalHover,
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
                  sx={{
                    border: "none",
                    boxShadow: custom_theme.customShadows.tableFunctional,
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                      boxShadow: custom_theme.customShadows.tableFunctionalHover,
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
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                      boxShadow: custom_theme.customShadows.tableFunctionalHover,
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
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": {
                      backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                      boxShadow: custom_theme.customShadows.tableFunctionalHover,
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
            <Box sx={{ mb: 2, p: 1, backgroundColor: "#f0f7ff", borderRadius: 1 }}>
              <Typography variant="body2" color="primary">
                {isLoading && searchValue ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Đang tìm kiếm "{searchValue}"...
                  </Box>
                ) : (
                  <>
                    Tìm thấy {crosssections.totalDocs} kết quả cho "{searchValue}"
                    {crosssections.totalDocs > 0 && (
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

          <CustomTable<CrossSectionOutputType>
            data={crosssections.data}
            total={crosssections.totalDocs}
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
      <CrossSectionModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedCrossSection={selectedCrossSection}
      />
    </Box>
  );
}