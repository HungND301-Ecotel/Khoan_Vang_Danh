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
} from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import PhaseModal from "../../components/PhaseModal/PhaseModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhaseOutputType, PhaseInputType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from '../../theme';

interface PhaseProps {
  searchValue?: string;
}

export default function Phase({ searchValue: parentSearchValue }: PhaseProps) {
  const [open, setOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseOutputType | null>(
    null
  );
  const [selectedPhases, setSelectedPhases] = useState<React.Key[]>([]);
  const [localSearchValue, setLocalSearchValue] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  // Use parent search value if provided, otherwise use local search
  const effectiveSearchValue = parentSearchValue !== undefined ? parentSearchValue : localSearchValue;

  const queryClient = useQueryClient();
  
  const { data: phases = [], isLoading } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => {
      try {
        const response = await api.get("/phases");
        return response.data.data || [];
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  // Add filtering delay simulation for better UX
  useEffect(() => {
    if (effectiveSearchValue) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300); // Small delay to show loading state
      
      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [effectiveSearchValue]);

  // Enhanced filtering with useMemo for performance
  const filteredPhases = useMemo(() => {
    if (!effectiveSearchValue.trim()) {
      return phases;
    }

    const searchTerm = effectiveSearchValue.toLowerCase().trim();
    
    return phases.filter((item: PhaseOutputType) => {
      const code = item.code?.toLowerCase() || "";
      const name = item.name?.toLowerCase() || "";
      const phaseGroupName = item.phaseGroup?.name?.toLowerCase() || "";
      
      return code.includes(searchTerm) || 
             name.includes(searchTerm) || 
             phaseGroupName.includes(searchTerm);
    });
  }, [phases, effectiveSearchValue]);

  const createMutation = useMutation({
    mutationFn: (newPhase: Partial<PhaseInputType>) =>
      api.post("/phases", newPhase).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatePhase: Partial<PhaseInputType>) =>
      api
        .put(`/phases/${updatePhase._id}`, updatePhase)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      setOpen(false);
      setSelectedPhase(null);
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
    if (selectedPhases.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedPhases.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedPhases.map((id) =>
          api.delete(`/phases/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["phases"] });
            setSelectedPhases([]);
            showSuccessAlert(
              `Đã xóa ${selectedPhases.length} bản ghi thành công`
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
      api.delete(`/phases/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<PhaseInputType>) => {
    if (selectedPhase) {
      updateMutation.mutate({ ...values, _id: selectedPhase._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (phase?: PhaseOutputType) => {
    if (phase) {
      setSelectedPhase(phase);
    } else {
      setSelectedPhase(null);
    }
    setOpen(true);
  };

  const handleClearSearch = () => {
    setLocalSearchValue("");
  };

  // Custom empty state component
  const EmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        {effectiveSearchValue ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {effectiveSearchValue 
          ? `Không có công đoạn nào phù hợp với "${effectiveSearchValue}"`
          : "Hiện tại chưa có công đoạn nào được tạo"
        }
      </Typography>
      {effectiveSearchValue && showLocalSearchUI && (
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

  const columns: TableProps<PhaseOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã công đoạn</Typography>,
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
      title: <Typography sx={{ fontWeight: "bold" }}>Tên công đoạn</Typography>,
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
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Nhóm công đoạn</Typography>
      ),
      dataIndex: "phaseGroup",
      key: "phaseGroup",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.phaseGroup?.name}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.phaseGroup?.name ?? "").localeCompare(
          b.phaseGroup?.name ?? "",
          "vi",
          { sensitivity: "base" }
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

  const rowSelection: TableRowSelection<PhaseOutputType> = {
    selectedRowKeys: selectedPhases,
    onChange: (newSelectedPhases: React.Key[]) => {
      setSelectedPhases(newSelectedPhases);
    },
  };

  // Only show search UI if not controlled by parent
  const showLocalSearchUI = parentSearchValue === undefined;

  return (
    <Box>
      <Box mt={3}>
        <Box>
          {showLocalSearchUI && (
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
                    disabled={selectedPhases.length === 0}
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
                    Xóa ({selectedPhases.length})
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
                    placeholder="Tìm kiếm theo mã, tên công đoạn hoặc nhóm công đoạn..."
                    value={localSearchValue}
                    onChange={(e) => setLocalSearchValue(e.target.value)}
                    sx={{ 
                      backgroundColor: (theme) => custom_theme.palette.table_filter_box.main,
                      "& .MuiInputBase-root": {
                        fontSize: "14px",
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {localSearchValue && (
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
          )}

          {/* Enhanced Search Results Info with Loading State */}
          {effectiveSearchValue && (
            <Box sx={{ mb: 2, p: 1, backgroundColor: "#f0f7ff", borderRadius: 1 }}>
              <Typography variant="body2" color="primary">
                {isFiltering ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Đang tìm kiếm "{effectiveSearchValue}"...
                  </Box>
                ) : (
                  <>
                    Tìm thấy {filteredPhases.length} kết quả cho "{effectiveSearchValue}"
                    {showLocalSearchUI && filteredPhases.length > 0 && (
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

          <Table<PhaseOutputType>
            rowKey="_id"
            rowSelection={rowSelection}
            loading={isLoading || isFiltering}
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
            dataSource={filteredPhases}
            locale={{
              emptyText: <EmptyState />
            }}
          />
        </Box>
      </Box>
      <PhaseModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhase={selectedPhase}
      />
    </Box>
  );
}