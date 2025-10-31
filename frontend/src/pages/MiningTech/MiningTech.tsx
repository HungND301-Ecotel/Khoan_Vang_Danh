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
import MiningTechModal from "../../components/MiningTechModal/MiningTechModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MiningtechType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from '../../theme';

export default function MiningTech() {
  const [open, setOpen] = useState(false);
  const [selectedMiningTech, setSelectedMiningTech] =
    useState<MiningtechType | null>(null);
  const [selectedMiningTechs, setSelectedMiningTechs] = useState<React.Key[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const queryClient = useQueryClient();
  const { data: miningtechs = [], isLoading, isFetching } = useQuery({
    queryKey: ["miningtechs"],
    queryFn: async () => {
      try {
        const response = await api.get("/miningtechs");
        return response.data.data || [];
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  // Enhanced filtering with useMemo for performance
  const filteredMiningTechs = useMemo(() => {
    if (!searchValue.trim()) {
      return miningtechs;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    return miningtechs.filter((item: MiningtechType) => {
      const name = item.name?.toLowerCase() || "";

      return name.includes(searchTerm);
    });
  }, [miningtechs, searchValue]);

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

  const createMutation = useMutation({
    mutationFn: (newMiningTech: Partial<MiningtechType>) =>
      api.post("/miningtechs", newMiningTech).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMiningTech: Partial<MiningtechType>) =>
      api
        .put(`/miningtechs/${updateMiningTech._id}`, updateMiningTech)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      setOpen(false);
      setSelectedMiningTech(null);
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
    if (selectedMiningTechs.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMiningTechs.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        selectedMiningTechs.forEach((id) => {
          deleteMutation.mutate(id as string);
        });

        setSelectedMiningTechs([]);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/miningtechs/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MiningtechType>) => {
    if (selectedMiningTech) {
      updateMutation.mutate({ ...values, _id: selectedMiningTech._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MiningTech?: MiningtechType) => {
    if (MiningTech) {
      setSelectedMiningTech(MiningTech);
    } else {
      setSelectedMiningTech(null);
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
                <Skeleton variant="text" width={250} sx={{ flex: 1 }} />
                <Skeleton variant="text" width={80} />
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
          ? `Không có Công nghệ khai thác nào phù hợp với "${searchValue}"`
          : "Hiện tại chưa có Công nghệ khai thác nào được tạo"
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

  const columns: TableProps<MiningtechType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã công nghệ khai thác
        </Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold", }}>
          {record.code}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Tên công nghệ khai thác
        </Typography>
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
      width: 50,
      render: (_, record) => (
        <IconButton onClick={() => handleOpen(record)}>
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<MiningtechType> = {
    selectedRowKeys: selectedMiningTechs,
    onChange: (newSelectedMiningTechs: React.Key[]) => {
      setSelectedMiningTechs(newSelectedMiningTechs);
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
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
                            Công nghệ khai thác
                        </Typography>  */}
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
                  disabled={selectedMiningTechs.length === 0}
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
                  Xóa ({selectedMiningTechs.length})
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
                  placeholder="Tìm kiếm theo Công nghệ khai thác..."
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
                    Tìm thấy {filteredMiningTechs.length} kết quả cho "{searchValue}"
                    {filteredMiningTechs.length > 0 && (
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
          <Table<MiningtechType>
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
                  Hiển thị {range[0]}-{range[1]} trên {total} mục
                </div>
              ),
            }}
            columns={columns}
            dataSource={filteredMiningTechs}
            locale={{
              emptyText: <EmptyState />
            }}
          />
        </Box>
      </Box>
      <MiningTechModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhaseGroup={selectedMiningTech}
      />
    </Box>
  );
}