import {
  Add,
  ArrowDropDown,
  Delete,
  Edit,
  Search,
  Mail,
  Print,
  FileDownload,
  FileUpload,
  FilterList,
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
import RockRatioModal from "../../components/RockRatioModal/RockRatioModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RockRatioType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";

export default function RockRatio() {
  const [open, setOpen] = useState(false);
  const [selectedRockRatio, setSelectedRockRatio] =
    useState<RockRatioType | null>(null);
  const [selectedRockRatios, setSelectedRockRatios] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: rockratios = [] } = useQuery({
    queryKey: ["rockratios"],
    queryFn: () => api.get("/rockratios").then((res) => res.data.data),
  });

  const filteredData = rockratios.filter((ratio: RockRatioType) =>
    ratio.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (newRockRatio: Partial<RockRatioType>) =>
      api.post("/rockratios", newRockRatio).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateRockRatio: Partial<RockRatioType>) =>
      api
        .put(`/rockratios/${updateRockRatio._id}`, updateRockRatio)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setOpen(false);
      setSelectedRockRatio(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return Promise.all(
        ids.map((id) => api.delete(`/rockratios/${id}`).then((res) => res.data))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setSelectedRockRatios([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    },
  });

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/rockratios/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedRockRatios.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    const confirmMessage =
      selectedRockRatios.length === 1
        ? "Bạn có muốn xóa 1 bản ghi? Hành động này không thể hoàn tác."
        : `Bạn có muốn xóa ${selectedRockRatios.length} bản ghi? Hành động này không thể hoàn tác.`;

    showConfirmAlert(confirmMessage).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedRockRatios as string[]);
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

  const handleSubmit = (values: Partial<RockRatioType>) => {
    if (selectedRockRatio) {
      updateMutation.mutate({ ...values, _id: selectedRockRatio._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (RockRatio?: RockRatioType) => {
    if (RockRatio) {
      setSelectedRockRatio(RockRatio);
    } else {
      setSelectedRockRatio(null);
    }
    setOpen(true);
  };

  const columns: TableProps<RockRatioType>["columns"] = [
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
          Tỉ lệ đá lẫn trong gương
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
    //     <IconButton onClick={() => {
    //       if (record._id) {
    //         handleDeleteSingle(record._id);
    //       }
    //     }} color="error">
    //       <Delete />
    //     </IconButton>
    //   )
    // },
  ];

  const rowSelection: TableRowSelection<RockRatioType> = {
    selectedRowKeys: selectedRockRatios,
    onChange: (newSelectedRockRatios: React.Key[]) => {
      setSelectedRockRatios(newSelectedRockRatios);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Tỉ lệ đá lẫn trong gương</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Tỉ lệ đá lẫn trong gương
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
                  disabled={selectedRockRatios.length === 0}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xóa ({selectedRockRatios.length})
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
          <Table<RockRatioType>
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
            dataSource={filteredData}
          />
        </Box>
      </Box>
      <RockRatioModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedRockRatio={selectedRockRatio}
      />
    </Box>
  );
}
