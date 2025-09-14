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
} from "@mui/material";
import React, { useState } from "react";
import HardnessModal from "../../components/HardnessModal/HardnessModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardnessType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from '../../theme';

export default function Hardness() {
  const [open, setOpen] = useState(false);
  const [selectedHardness, setSelectedHardness] = useState<HardnessType | null>(
    null
  );
  const [selectedHardnesses, setSelectedHardnesses] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: hardness = [] } = useQuery({
    queryKey: ["hardness"],
    queryFn: () => api.get("/hardness").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newHardness: Partial<HardnessType>) =>
      api.post("/hardness", newHardness).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateHardness: Partial<HardnessType>) =>
      api
        .put(`/hardness/${updateHardness._id}`, updateHardness)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      setOpen(false);
      setSelectedHardness(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
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
    if (selectedHardnesses.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedHardnesses.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        // Tạo mảng các promise để xóa từng bản ghi
        const deletePromises = selectedHardnesses.map((id) =>
          api.delete(`/hardness/${id}`)
        );

        // Thực hiện xóa tất cả
        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["hardness"] });
            setSelectedHardnesses([]);
            showSuccessAlert(
              `Đã xóa ${selectedHardnesses.length} bản ghi thành công`
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
      api.delete(`/hardness/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<HardnessType>) => {
    if (selectedHardness) {
      updateMutation.mutate({ ...values, _id: selectedHardness._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (hardness?: HardnessType) => {
    if (hardness) {
      setSelectedHardness(hardness);
    } else {
      setSelectedHardness(null);
    }
    setOpen(true);
  };

  const columns: TableProps<HardnessType>["columns"] = [
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
          Độ cứng của than/ đá (f)
        </Typography>
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
      dataIndex: "edit",
      width: 50,
      render: (_, record) => (
        <IconButton onClick={() => handleOpen(record)}>
          <Edit />
        </IconButton>
      ),
    },
    // {
    //   title: <Typography sx={{ fontWeight: 'bold' }}>Xóa</Typography>,
    //   dataIndex: 'delete',
    //   width: 50,
    //   render: (_, record) => (
    //     <IconButton onClick={() => handleDelete(record._id)} color="error">
    //       <Delete />
    //     </IconButton>
    //   )
    // },
  ];

  const rowSelection: TableRowSelection<HardnessType> = {
    selectedRowKeys: selectedHardnesses,
    onChange: (newSelectedHardnesses: React.Key[]) => {
      setSelectedHardnesses(newSelectedHardnesses);
    },
  };

  // Lọc dữ liệu dựa trên giá trị tìm kiếm
  const filteredHardness = hardness.filter((item: HardnessType) =>
    item.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Độ cứng của than/ đá (f)</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Độ cứng của than/ đá (f)
            </Typography> */}
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
                  disabled={selectedHardnesses.length === 0}
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
                  Xóa ({selectedHardnesses.length})
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
                  placeholder="Tìm kiếm"
                  onChange={(e) => setSearchValue(e.target.value)}
                  sx={{ backgroundColor: (theme) => custom_theme.palette.table_filter_box.main }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search sx={{ fontSize: 24 }} />
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
          <Table<HardnessType>
            rowKey="_id"
            rowSelection={rowSelection}
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
            dataSource={filteredHardness}
          />
        </Box>
      </Box>
      <HardnessModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedHardness={selectedHardness}
      />
    </Box>
  );
}
