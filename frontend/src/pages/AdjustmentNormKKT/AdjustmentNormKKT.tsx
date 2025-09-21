import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Container,
  Box,
  MenuItem,
  Grid,
  Button,
  Typography,
  IconButton,
  Breadcrumbs,
  InputAdornment,
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
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
import AdjustmentNormKCTModal from "../../components/AdjustmentNormKKTModal/AdjustmentNormKKTModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table as AntTable, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from '../../theme';

export default function AdjustmentNormKKT() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all data without search parameter to handle filtering locally
  const { data: adjustmentnorms = [], isLoading, isFetching } = useQuery({
    queryKey: ["adjustmentnorms"],
    queryFn: async () => {
      try {
        const response = await api.get(`/adjustmentnorms`);
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

  // Filter data based on type and search value
  const filteredData = useMemo(() => {
    // First filter by type
    const typeFiltered = adjustmentnorms.filter(
      (i: AdjustmentNormOutputType) => i.type === "CKKT"
    );

    // Then filter by search value
    if (!searchValue.trim()) {
      return typeFiltered;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    
    return typeFiltered.filter((item: AdjustmentNormOutputType) => {
      // Search in main fields
      const code = item.code?.toLowerCase() || "";
      const hardnessName = item.hardness?.name?.toLowerCase() || "";
      const rockRatioName = item.rockRatio?.name?.toLowerCase() || "";
      
      // Search in norms
      const normsMatch = item.norms?.some((norm: any) => {
        const assignmentCode = norm.assignmentCode?.code?.toLowerCase() || "";
        const assignmentName = norm.assignmentCode?.name?.toLowerCase() || "";
        const normValue = norm.norm?.toString().toLowerCase() || "";
        
        return assignmentCode.includes(searchTerm) || 
               assignmentName.includes(searchTerm) || 
               normValue.includes(searchTerm);
      });

      return code.includes(searchTerm) || 
             hardnessName.includes(searchTerm) || 
             rockRatioName.includes(searchTerm) || 
             normsMatch;
    });
  }, [adjustmentnorms, searchValue]);

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
          updateAdjustmentNorm
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/adjustmentnorms/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      showSuccessAlert("Xóa thành công");
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

  // Loading skeleton for initial page load
  const LoadingSkeleton = () => (
    <Box>
      {/* Toolbar skeleton */}
      <Box sx={{ mb: 2 }}>
        <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
          <Box display={"flex"} gap={2}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={80} height={36} />
          </Box>
          <Box display={"flex"} flex={1} gap={2}>
            <Skeleton variant="rectangular" width={60} height={36} />
            <Skeleton variant="rectangular" height={36} sx={{ flex: 1 }} />
          </Box>
          <Box display={"flex"} gap={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" width={80} height={36} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Table skeleton */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Skeleton variant="rectangular" width={20} height={20} />
                <Skeleton variant="text" width={50} />
                <Skeleton variant="text" width={200} sx={{ flex: 1 }} />
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  // Custom empty state component
  const EmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        {searchValue ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {searchValue 
          ? `Không có hệ số điều chỉnh CKKT nào phù hợp với "${searchValue}"`
          : "Hiện tại chưa có hệ số điều chỉnh CKKT nào được tạo"
        }
      </Typography>
      {searchValue && (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleClearSearch}
          sx={{ mt: 1 }}
        >
          Xóa bộ lọc
        </Button>
      )}
    </Box>
  );

  const columns: TableProps<AdjustmentNormOutputType>["columns"] = [
    {
      title: "STT",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã định mức giao khoán
        </Typography>
      ),
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
                  {item.norm ? item.norm.toLocaleString() : ""}
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
                  onClick={handleDelete}
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
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                  placeholder="Tìm kiếm theo mã định mức, độ cứng, tỷ lệ đá, mã giao khoán..."
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    Tìm thấy {filteredData.length} kết quả cho "{searchValue}"
                    {filteredData.length > 0 && (
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

          <AntTable<AdjustmentNormOutputType>
            rowKey="_id"
            rowSelection={rowSelection}
            loading={isFiltering || isFetching}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => {
                setExpandedRow(expanded ? record._id || null : null);
              },
              expandedRowRender,
            }}
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
            dataSource={filteredData}
            locale={{
              emptyText: <EmptyState />
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
    </Box>
  );
}