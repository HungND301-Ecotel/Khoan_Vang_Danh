import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  InputAdornment,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  RemoveRedEyeOutlined,
  FilterList,
  Print,
  Search,
  FileUpload,
  FileDownload,
  Mail,
  ArrowDropDown,
} from "@mui/icons-material";
import { Table, TableProps } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import CoalCuttingNormKBModal from "../../components/CoalCuttingNormKBModal/CoalCuttingNormKBModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { AssignmentNormOutputType, AssignmentNormInputType } from "../../types";
import { TableRowSelection } from "antd/es/table/interface";

export default function CoalCuttingNormKB() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ["assignmentnorms", searchValue],
    queryFn: async () =>
      api.get(`/assignmentnorms?q=${searchValue}`).then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newItem: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", newItem).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setModalOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (err: any) => {
      showErrorAlert(err.response?.data?.message || err.message || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (item: Partial<AssignmentNormInputType>) =>
      api.put(`/assignmentnorms/${item._id}`, item).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setModalOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (err: any) => {
      showErrorAlert(err.response?.data?.message || err.message || "Lỗi");
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete("/assignmentnorms", { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setSelectedRowKeys([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (err: any) => {
      showErrorAlert(err.response?.data?.message || err.message || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenModal = (item?: AssignmentNormOutputType) => {
    setSelected(item || null);
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedRowKeys.length} bản ghi? hành động này không thể hoàn tác.`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteManyMutation.mutate(selectedRowKeys);
      }
    });
  };

  const columns: TableProps<AssignmentNormOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_value, _record, index) => <Typography>{index + 1}</Typography>,
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
      key: "view",
      width: 60,
      render: (_v, record) => (
        <IconButton
          size="small"
          onClick={() => {
            // nếu cần mở modal xem, set selected và mở modal read-only
            console.log("Xem", record);
          }}
        >
          <RemoveRedEyeOutlined />
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "edit",
      key: "edit",
      width: 60,
      render: (_v, record) => (
        <IconButton size="small" onClick={() => handleOpenModal(record)}>
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<AssignmentNormOutputType> = {
    selectedRowKeys,
    onChange: (newSelected) => setSelectedRowKeys(newSelected),
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  color="warning"
                  endIcon={<Add />}
                  onClick={() => handleOpenModal()}
                >
                  Tạo mới
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  endIcon={<Delete />}
                  onClick={() => handleDelete()}
                >
                  Xóa
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
                >
                  Tải lên
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileDownload />}
                >
                  Xuất file
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Print />}
                >
                  In
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Mail />}
                  endIcon={<ArrowDropDown />}
                >
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>

          <Table<AssignmentNormOutputType>
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
            dataSource={assignmentnorms.filter(
              (i: any) => i.type === "coal_kb"
            )}
          />

          <CoalCuttingNormKBModal
            open={modalOpen}
            setOpen={setModalOpen}
            handleSubmit={handleSubmit}
            selected={selected}
          />
        </Box>
      </Box>
    </Box>
  );
}
