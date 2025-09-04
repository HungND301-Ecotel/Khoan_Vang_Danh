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
import ExcavationTechModal from "../../components/ExcavationTechModal/ExcavationTechModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExcavationTechType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";

export default function ExcavationTech() {
  const [open, setOpen] = useState(false);
  const [selectedExcavationTech, setSelectedExcavationTech] =
    useState<ExcavationTechType | null>(null);
  const [selectedExcavationTechs, setSelectedExcavationTechs] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: excavationtechs = [] } = useQuery({
    queryKey: ["excavationtechs"],
    queryFn: () => api.get("/excavationtechs").then((res) => res.data.data),
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
        // Tạo mảng các promise để xóa từng bản ghi
        const deletePromises = selectedExcavationTechs.map((id) =>
          api.delete(`/excavationtechs/${id}`)
        );

        // Thực hiện xóa tất cả
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

  const columns: TableProps<ExcavationTechType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Công nghệ xúc</Typography>,
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
    //     title: <Typography sx={{ fontWeight: 'bold' }}>Xóa</Typography>,
    //     dataIndex: 'delete',
    //     width: 50,
    //     render: (_, record) => (
    //         <IconButton onClick={() => handleDelete(record._id)} color="error">
    //             <Delete />
    //         </IconButton>
    //     )
    // },
  ];

  const rowSelection: TableRowSelection<ExcavationTechType> = {
    selectedRowKeys: selectedExcavationTechs,
    onChange: (newSelectedExcavationTechs: React.Key[]) => {
      setSelectedExcavationTechs(newSelectedExcavationTechs);
    },
  };

  // Lọc dữ liệu dựa trên giá trị tìm kiếm
  const filteredExcavationTechs = excavationtechs.filter(
    (item: ExcavationTechType) =>
      item.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Công nghệ xúc</Typography>
            </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
                            Công nghệ xúc
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
                  onClick={handleDeleteMultiple}
                  disabled={selectedExcavationTechs.length === 0}
                  sx={{
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
          <Table<ExcavationTechType>
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
            dataSource={filteredExcavationTechs}
          />
        </Box>
      </Box>
      <ExcavationTechModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedExcavationTech={selectedExcavationTech}
      />
    </Box>
  );
}
