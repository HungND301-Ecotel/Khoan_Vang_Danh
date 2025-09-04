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
import LengthModal from "../../components/LengthModal/LengthModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LengthType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";

export default function Length() {
  const [open, setOpen] = useState(false);
  const [selectedLength, setSelectedLength] = useState<LengthType | null>(null);
  const [selectedLengths, setSelectedLengths] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: length = [] } = useQuery({
    queryKey: ["length"],
    queryFn: () => api.get("/length").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newLength: Partial<LengthType>) =>
      api.post("/length", newLength).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateLength: Partial<LengthType>) =>
      api
        .put(`/length/${updateLength._id}`, updateLength)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setOpen(false);
      setSelectedLength(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = (id?: string) => {
    // Xóa nhiều bản ghi
    if (!id && selectedLengths.length > 0) {
      showConfirmAlert(
        `Bạn có muốn xóa ${selectedLengths.length} bản ghi đã chọn?`
      ).then((result) => {
        if (result.isConfirmed) {
          // Gọi API xóa nhiều
          const deletePromises = selectedLengths.map((lengthId) =>
            api.delete(`/length/${lengthId}`)
          );

          Promise.all(deletePromises)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["length"] });
              setSelectedLengths([]);
              showSuccessAlert(
                `Đã xóa ${selectedLengths.length} bản ghi thành công`
              );
            })
            .catch((error) => {
              console.log(
                error.response?.data?.message || error.response || "Lỗi"
              );
              showErrorAlert(
                error.response?.data?.message ||
                  error.response ||
                  "Lỗi khi xóa nhiều bản ghi"
              );
            });
        }
      });
      return;
    }

    // Xóa một bản ghi
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/length/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setSelectedLengths([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<LengthType>) => {
    if (selectedLength) {
      updateMutation.mutate({ ...values, _id: selectedLength._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (lengthItem?: LengthType) => {
    if (lengthItem) {
      setSelectedLength(lengthItem);
    } else {
      setSelectedLength(null);
    }
    setOpen(true);
  };

  const columns: TableProps<LengthType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Chiều dài lò</Typography>,
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

  const rowSelection: TableRowSelection<LengthType> = {
    selectedRowKeys: selectedLengths,
    onChange: (newSelectedLengths: React.Key[]) => {
      setSelectedLengths(newSelectedLengths);
    },
  };

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Chiều dài lò</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Chiều dài lò
            </Typography> */}
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  color="warning"
                  endIcon={<Add />}
                  onClick={() => handleOpen()}
                  sx={{
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
                  color="error"
                  endIcon={<Delete />}
                  onClick={() => handleDelete()}
                  disabled={selectedLengths.length === 0}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xóa ({selectedLengths.length})
                </Button>
              </Box>
              <Box display={"flex"} flex={1} gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FilterList />}
                  sx={{
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
          <Table<LengthType>
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
            dataSource={length}
          />
        </Box>
      </Box>
      <LengthModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedLength={selectedLength}
      />
    </Box>
  );
}
