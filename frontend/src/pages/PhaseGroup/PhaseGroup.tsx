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
import PhaseGroupModal from "../../components/PhaseGroupModal/PhaseGroupModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhaseGroupType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from '../../theme';
import PhaseGroupService from "../../service/PhaseGroupService";
import { parseAxiosError } from "../../utils/handleApiError";

interface PhaseGroupProps {
  searchValue?: string;
}

export default function PhaseGroup({ searchValue: parentSearchValue }: PhaseGroupProps) {
  const [open, setOpen] = useState(false);
  const [selectedPhaseGroup, setSelectedPhaseGroup] =
    useState<PhaseGroupType | null>(null);
  const [selectedPhaseGroups, setSelectedPhaseGroups] = useState<React.Key[]>(
    []
  );
  const [localSearchValue, setLocalSearchValue] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  // Use parent search value if provided, otherwise use local search
  const effectiveSearchValue = parentSearchValue !== undefined ? parentSearchValue : localSearchValue;

  const queryClient = useQueryClient();

  const { data: phasegroups = [], isLoading } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => {
      try {
        const response = await api.get("/phasegroups");
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
  const filteredData = useMemo(() => {
    if (!effectiveSearchValue.trim()) {
      return phasegroups;
    }

    const searchTerm = effectiveSearchValue.toLowerCase().trim();

    return phasegroups.filter((phaseGroup: PhaseGroupType) => {
      const code = phaseGroup.code?.toLowerCase() || "";
      const name = phaseGroup.name?.toLowerCase() || "";

      return code.includes(searchTerm) || name.includes(searchTerm);
    });
  }, [phasegroups, effectiveSearchValue]);

  const createMutation = useMutation({
    mutationFn: (newPhaseGroup: Partial<PhaseGroupType>) =>
      api.post("/phasegroups", newPhaseGroup).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: PhaseGroupService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error)
      showErrorAlert(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatePhaseGroup: Partial<PhaseGroupType>) =>
      api
        .put(`/phasegroups/${updatePhaseGroup._id}`, updatePhaseGroup)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      setSelectedPhaseGroup(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return Promise.all(
        ids.map((id) =>
          api.delete(`/phasegroups/${id}`).then((res) => res.data)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setSelectedPhaseGroups([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    },
  });

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/phasegroups/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedPhaseGroups.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    const confirmMessage =
      selectedPhaseGroups.length === 1
        ? "Bạn có muốn xóa 1 bản ghi? Hành động này không thể hoàn tác."
        : `Bạn có muốn xóa ${selectedPhaseGroups.length} bản ghi? Hành động này không thể hoàn tác.`;

    showConfirmAlert(confirmMessage).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedPhaseGroups as string[]);
      }
    });
  };

  const handleDeleteSingle = (id: string) => {
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteSingleMutation.mutate(id);
      }
    });
  };

  const handleSubmit = (values: Partial<PhaseGroupType>) => {
    if (selectedPhaseGroup) {
      updateMutation.mutate({ ...values, _id: selectedPhaseGroup._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (phaseGroup?: PhaseGroupType) => {
    if (phaseGroup) {
      setSelectedPhaseGroup(phaseGroup);
    } else {
      setSelectedPhaseGroup(null);
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
          ? `Không có nhóm công đoạn nào phù hợp với "${effectiveSearchValue}"`
          : "Hiện tại chưa có nhóm công đoạn nào được tạo"
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

  const columns: TableProps<PhaseGroupType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Mã nhóm công đoạn</Typography>
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
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên nhóm công đoạn</Typography>
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
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "actions",
      width: 120,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <IconButton onClick={() => handleOpen(record)}>
            <Edit color="primary" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<PhaseGroupType> = {
    selectedRowKeys: selectedPhaseGroups,
    onChange: (newSelectedPhaseGroups: React.Key[]) => {
      setSelectedPhaseGroups(newSelectedPhaseGroups);
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
                    disabled={selectedPhaseGroups.length === 0}
                  >
                    Xóa ({selectedPhaseGroups.length})
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
                    placeholder="Tìm kiếm theo mã hoặc tên nhóm công đoạn..."
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
                    Tìm thấy {filteredData.length} kết quả cho "{effectiveSearchValue}"
                    {showLocalSearchUI && filteredData.length > 0 && (
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

          <Table<PhaseGroupType>
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
            dataSource={filteredData}
            locale={{
              emptyText: <EmptyState />
            }}
          />
        </Box>
      </Box>
      <PhaseGroupModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhaseGroup={selectedPhaseGroup}
      />
    </Box>
  );
}