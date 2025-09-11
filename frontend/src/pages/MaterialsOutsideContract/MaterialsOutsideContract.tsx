import React, { useState } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TableProps, Table } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

import MaterialsOutsideContractModal from "../../components/MaterialsOutsideContractModal/MaterialsOutsideContractModal";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import {
  MaterialAssignmentInputType,
  MaterialFormValues,
  Materials,
  UnitType,
  AssignmentCodeOutputType,
} from "../../types";

export default function MaterialsOutsideContract() {
  const [open, setOpen] = useState(false);
  const [selectedMaterialAssignment, setSelectedMaterialAssignment] =
    useState<Materials | null>(null);
  const [selectedMaterialAssignments, setSelectedMaterialAssignments] =
    useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: materialAssignments = [] } = useQuery({
    queryKey: ["materialsOutsideContract"],
    queryFn: () =>
     api.get("/materials-outside-contract")
.then((res) => res.data.data), 
  });

  const filteredData = materialAssignments.filter((item: Materials) => {
    const search = searchValue.toLowerCase();

    return (
      item.code?.toLowerCase().includes(search) ||
      item.name?.toLowerCase().includes(search) ||
      item.uom?.name?.toLowerCase().includes(search) ||
      (item.quantity !== undefined &&
        item.quantity !== null &&
        (String(item.quantity).includes(search) ||
          item.quantity === Number(searchValue)))
    );
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialAssignment: Partial<Materials>) =>
      api
          .post("/materials-outside-contract", newMaterialAssignment)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialsOutsideContract"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMaterialAssignment: Partial<Materials>) =>
      api
       .put(
        `/materials-outside-contract/${updateMaterialAssignment._id}`, 
        updateMaterialAssignment
      )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialsOutsideContract"] });
      setOpen(false);
      setSelectedMaterialAssignment(null);
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
    if (selectedMaterialAssignments.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMaterialAssignments.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedMaterialAssignments.map(
           (id) => api.delete(`/materials-outside-contract/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ["materialsOutsideContract"],
            });
            setSelectedMaterialAssignments([]);
            showSuccessAlert(
              `Đã xóa ${selectedMaterialAssignments.length} bản ghi thành công`
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
       api.delete(`/materials-outside-contract/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialsOutsideContract"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MaterialAssignmentInputType>) => {
  const submitValues: Partial<Materials> = {
    code: values.code,
    name: values.name,
    quantity: values.quantity,
    currentPrice: values.currentPrice, 
  };

  if (values.priceHistory) {
    submitValues.priceHistory = values.priceHistory.map((item) => ({
      price: item.price ?? 0,
      startDate: item.startDate ? new Date(item.startDate) : new Date(),
      endDate: item.endDate ? new Date(item.endDate) : new Date(),
    }));
  }

  if (selectedMaterialAssignment) {
    updateMutation.mutate({
      ...submitValues,
      _id: selectedMaterialAssignment._id,
    });
  } else {
    createMutation.mutate(submitValues);
  }
};

  const handleOpen = (record?: Materials) => {
    if (record) {
      setSelectedMaterialAssignment(record);
    } else {
      setSelectedMaterialAssignment(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const columns: TableProps<Materials>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên vật tư</Typography>,
      dataIndex: "name",
      key: "name",
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "uom",
      key: "uom",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.uom?.name}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
      dataIndex: "quantity",
      key: "quantity",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.quantity ? record.quantity.toLocaleString() : ""}
        </Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.currentPrice ? record.currentPrice.toLocaleString() : ""}
        </Typography>
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

  const rowSelection: TableRowSelection<Materials> = {
    selectedRowKeys: selectedMaterialAssignments,
    onChange: (newSelectedMaterialAssignments: React.Key[]) => {
      setSelectedMaterialAssignments(newSelectedMaterialAssignments);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Vật tư tài sản</Typography>
        <Typography>Vật tư, tài sản ngoài khoán</Typography>
      </Breadcrumbs>

      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Vật tư, tài sản ngoài khoán
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
                  disabled={selectedMaterialAssignments.length === 0}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                >
                  Xóa ({selectedMaterialAssignments.length})
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
          <Table<Materials>
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
      <MaterialsOutsideContractModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedMaterialOutsideContract={selectedMaterialAssignment}
      />
    </Box>
  );
}
