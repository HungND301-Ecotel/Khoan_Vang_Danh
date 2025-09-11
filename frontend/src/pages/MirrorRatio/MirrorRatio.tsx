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
import MirrorRatioModal from "../../components/MirrorRatioModal/MirrorRatioModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MirrorRatioType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";

export default function MirrorRatio() {
  const [open, setOpen] = useState(false);
  const [selectedMirrorRatio, setSelectedMirrorRatio] =
    useState<MirrorRatioType | null>(null);
  const [selectedMirrorRatios, setSelectedMirrorRatios] = useState<React.Key[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: mirrorratios = [] } = useQuery({
    queryKey: ["mirrorratios"],
    queryFn: () => api.get("/mirrorratios").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newMirrorRatio: Partial<MirrorRatioType>) =>
      api.post("/mirrorratios", newMirrorRatio).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMirrorRatio: Partial<MirrorRatioType>) =>
      api
        .put(`/mirrorratios/${updateMirrorRatio._id}`, updateMirrorRatio)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setOpen(false);
      setSelectedMirrorRatio(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDeleteSingle = (id: string) => {
    if (!id) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteSingleMutation.mutate(id);
      }
    });
  };

  const handleDeleteMultiple = () => {
    if (selectedMirrorRatios.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMirrorRatios.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedMirrorRatios as string[]);
      }
    });
  };

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/mirrorratios/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map((id) => api.delete(`/mirrorratios/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setSelectedMirrorRatios([]); // Clear selection sau khi xóa
      showSuccessAlert("Xóa thành công tất cả bản ghi đã chọn");
    },
    onError: (error: any) => {
      showErrorAlert("Có lỗi xảy ra khi xóa bản ghi");
    },
  });

  const handleSubmit = (values: Partial<MirrorRatioType>) => {
    if (selectedMirrorRatio) {
      updateMutation.mutate({ ...values, _id: selectedMirrorRatio._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MirrorRatio?: MirrorRatioType) => {
    if (MirrorRatio) {
      setSelectedMirrorRatio(MirrorRatio);
    } else {
      setSelectedMirrorRatio(null);
    }
    setOpen(true);
  };

  const columns: TableProps<MirrorRatioType>["columns"] = [
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
          Tỉ lệ gương than mềm
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
      title: <Typography sx={{ fontWeight: "bold" }}>sửa</Typography>,
      dataIndex: "actions",
      width: 100,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <IconButton onClick={() => handleOpen(record)}>
                   <Edit />
                 </IconButton>
          {/* <IconButton onClick={() => handleDeleteSingle(record._id!)}>
            <Delete color="error" />
          </IconButton> */}
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<MirrorRatioType> = {
    selectedRowKeys: selectedMirrorRatios,
    onChange: (newSelectedMirrorRatios: React.Key[]) => {
      setSelectedMirrorRatios(newSelectedMirrorRatios);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Tỉ lệ gương than mềm</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Tỉ lệ gương than mềm
            </Typography>
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
                  disabled={selectedMirrorRatios.length === 0}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xóa ({selectedMirrorRatios.length})
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
                  value={searchValue}
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
          <Table<MirrorRatioType>
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
            dataSource={mirrorratios.filter((item: MirrorRatioType) =>
              item.name?.toLowerCase().includes(searchValue.toLowerCase())
            )}
          />
        </Box>
      </Box>
      <MirrorRatioModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedMirrorRatio={selectedMirrorRatio}
      />
    </Box>
  );
}
