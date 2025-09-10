import {
  Add,
  ArrowDropDown,
  Delete,
  Edit,
  FileDownload,
  FileUpload,
  Filter,
  Filter1Outlined,
  FilterList,
  ImportExport,
  Mail,
  Print,
  Search,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import UnitModal from "../../components/UnitModal/UnitModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UnitType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

export default function Unit() {
  const [open, setOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: units = [] } = useQuery({
    queryKey: ["units", searchValue],
    queryFn: () =>
      api.get(`/units?q=${searchValue}`).then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newUnit: Partial<UnitType>) =>
      api.post("/units", newUnit).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const updateMutation = useMutation({
    mutationFn: (updateUnit: Partial<UnitType>) =>
      api.put(`/units/${updateUnit._id}`, updateUnit).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setOpen(false);
      setSelectedUnit(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleDelete = () => {
    if (selectedUnits.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedUnits.length} bản ghi? hành động này không thể hoàn tác.`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedUnits);
      }
    });
  };
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/units`, { data: { ids } }).then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setSelectedUnits([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleSubmit = (values: Partial<UnitType>) => {
    if (selectedUnit) {
      updateMutation.mutate({ ...values, _id: selectedUnit._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (Unit?: UnitType) => {
    if (Unit) {
      setSelectedUnit(Unit);
    } else {
      setSelectedUnit(null);
    }
    setOpen(true);
  };

  const handleImport = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx, .xls";
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      showConfirmAlert(
        "Bạn có chắc chắn muốn import dữ liệu từ file này?"
      ).then((result) => {
        if (result.isConfirmed) {
          api
            .post("/units/importFile", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              const { summary, invalidRows } = response.data;
              let message = `Import thành công!<br/>
            Tổng: ${summary.totalProcessed}<br/>
            Thêm mới: ${summary.insertedCount}<br/>
            Cập nhật: ${summary.updatedCount}<br/>
            Lỗi: ${summary.invalidCount}`;

              if (invalidRows.length > 0) {
                message += `<br/><br/>Các dòng lỗi: ${invalidRows
                  .map((row: any) => JSON.stringify(row))
                  .join("<br/>")}`;
              }

              showSuccessAlert(message); // Bỏ argument thứ hai nếu không cần
              queryClient.invalidateQueries({ queryKey: ["units"] });
            })
            .catch((error) => {
              showErrorAlert(
                error.response?.data?.message || "Import thất bại"
              );
            });
        }
      });
    }
  };
  input.click();
};

  
  const columns: TableProps<UnitType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn vị tính</Typography>,
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
  ];

  const rowSelection: TableRowSelection<UnitType> = {
    selectedRowKeys: selectedUnits,
    onChange: (newSelectedUnits: React.Key[]) => {
      setSelectedUnits(newSelectedUnits);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Đơn vị tính</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Đơn vị tính
            </Typography>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
                  color="warning"
                  endIcon={<Add />}
                  onClick={() => handleOpen()}
                >
                  Tạo mới
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
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
          <Table<UnitType>
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
            dataSource={units}
          />
        </Box>
      </Box>
      <UnitModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedUnit={selectedUnit}
      />
    </Box>
  );
}
