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
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import AssignmentCodeModal from "../../components/AssignmentCodeModal/AssignmentCodeModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssignmentCodeInputType, AssignmentCodeOutputType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { Table, TableProps } from "antd";
import custom_theme from '../../theme';
import AssignmentCodeService from "../../service/AssignmentCodeService";
import { parseAxiosError } from "../../utils/handleApiError";
import LoadingSkeleton from "../../ui/LoadingSkeleton";
import EmptyState from "../../ui/EmptyState";

export default function AssignmentCode() {
  const [open, setOpen] = useState(false);
  const [selectedAssignmentCode, setSelectedAssignmentCode] =
    useState<AssignmentCodeOutputType | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const queryClient = useQueryClient();

  const { data: assignmentcodes = [], isLoading, isFetching } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () => {
      try {
        const response = await api.get("/assignmentcodes");
        return response.data.data || [];
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  // Add filtering delay simulation for better UX
  useEffect(() => {
    if (searchValue) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [searchValue]);

  // Enhanced filtering with useMemo for performance
  const filteredAssignmentCodes = useMemo(() => {
    if (!searchValue.trim()) {
      return assignmentcodes;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    return assignmentcodes.filter((item: AssignmentCodeInputType) => {
      const name = item.name?.toLowerCase() || "";
      const code = item.code?.toLowerCase() || "";

      return name.includes(searchTerm) || code.includes(searchTerm);
    });
  }, [assignmentcodes, searchValue]);

  const createMutation = useMutation({
    mutationFn: (newAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api.post("/assignmentcodes", newAssignmentCode).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: AssignmentCodeService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error)
      showErrorAlert(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api
        .put(
          `/assignmentcodes/${updateAssignmentCode._id}`,
          updateAssignmentCode
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      setSelectedAssignmentCode(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleDelete = () => {
    if (selectedAssignmentCodes.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedAssignmentCodes.length} bản ghi? hành động này không thể hoàn tác.`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedAssignmentCodes);
      }
    });
  };
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api
        .delete(`/assignmentcodes`, { data: { ids } })
        .then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setSelectedAssignmentCodes([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleSubmit = (values: Partial<AssignmentCodeInputType>) => {
    if (selectedAssignmentCode) {
      updateMutation.mutate({ ...values, _id: selectedAssignmentCode._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (AssignmentCode?: AssignmentCodeOutputType) => {
    if (AssignmentCode) {
      setSelectedAssignmentCode(AssignmentCode);
    } else {
      setSelectedAssignmentCode(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  // Custom empty state component

  const columns: TableProps<AssignmentCodeOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã thiết bị</Typography>,
      dataIndex: "deviceCode",
      key: "deviceCode",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.deviceCode?.code}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.deviceCode?.code ?? "").localeCompare(
          b.deviceCode?.code ?? "",
          "vi",
          { sensitivity: "base" }
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
      dataIndex: "code",
      key: "code",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên giao khoán</Typography>
      ),
      dataIndex: "name",
      key: "name",
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
        <Typography sx={{ fontWeight: "bold" }}>{record.uom?.name}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.price ? record.price.toLocaleString() : ""}
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

  const rowSelection: TableRowSelection<AssignmentCodeOutputType> = {
    selectedRowKeys: selectedAssignmentCodes,
    onChange: (newSelectedAssignmentCodes: React.Key[]) => {
      setSelectedAssignmentCodes(newSelectedAssignmentCodes);
    },
  };

  // Show loading skeleton on initial load
  if (isLoading) {
    return (
      <Box>
        <Box mt={3}>
          <LoadingSkeleton />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Mã giao khoán</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main }}>
              Mã giao khoán
            </Typography>
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
                  onClick={() => handleDelete()}
                  disabled={selectedAssignmentCodes.length === 0}
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
                  {deleteMutation.isPending
                    ? "Đang xóa..."
                    : `Xóa (${selectedAssignmentCodes.length})`}
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
                  placeholder="Tìm kiếm theo mã giao khoán hoặc tên giao khoán..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  sx={{ backgroundColor: (theme) => custom_theme.palette.table_filter_box.main }}
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
                        {isFiltering ? (
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
                  onClick={() => exportExcel.mutate()}
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
                {isFiltering ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Đang tìm kiếm "{searchValue}"...
                  </Box>
                ) : (
                  <>
                    Tìm thấy {filteredAssignmentCodes.length} kết quả cho "{searchValue}"
                    {filteredAssignmentCodes.length > 0 && (
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
          <Table<AssignmentCodeOutputType>
            rowKey="_id"
            rowSelection={rowSelection}
            loading={isFiltering || isFetching}
            pagination={{
              position: ["bottomCenter"],
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              defaultPageSize: 10,
              showTotal: (total, range) => (
                <div style={{ flex: 1, textAlign: "left" }}>
                  {isFiltering ? (
                    <Typography variant="body2" color="primary">
                      Đang lọc...
                    </Typography>
                  ) : (
                    `Hiển thị ${range[0]}-${range[1]} trên ${total} mục`
                  )}
                </div>
              ),
            }}
            columns={columns}
            dataSource={filteredAssignmentCodes}
            locale={{
              emptyText: <EmptyState searchValue={searchValue} handleClearSearch={handleClearSearch} />
            }}
          />
        </Box>
      </Box>
      <AssignmentCodeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedAssignmentCode={selectedAssignmentCode}
      />
    </Box>
  );
}