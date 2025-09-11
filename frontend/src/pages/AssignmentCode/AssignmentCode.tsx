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
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useRef } from "react";
import AssignmentCodeModal from "../../components/AssignmentCodeModal/AssignmentCodeModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssignmentCodeInputType, AssignmentCodeOutputType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { Table, TableProps } from "antd";

export default function AssignmentCode() {
  const [open, setOpen] = useState(false);
  const [selectedAssignmentCode, setSelectedAssignmentCode] =
    useState<AssignmentCodeOutputType | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ["assignmentcodes", searchValue],
    queryFn: () =>
      api.get(`/assignmentcodes?q=${searchValue}`).then((res) => res.data.data),
  });

  const filteredData = assignmentcodes.filter(
    (item: AssignmentCodeOutputType) => {
      const keyword = searchValue.toLowerCase();
      return (
        item.code?.toLowerCase().includes(keyword) ||
        item.name?.toLowerCase().includes(keyword) ||
        item.deviceCode?.code?.toLowerCase().includes(keyword) ||
        item.uom?.name?.toLowerCase().includes(keyword) ||
        item.price?.toString().includes(keyword)
      );
    }
  );

  const createMutation = useMutation({
    mutationFn: (newAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api.post("/assignmentcodes", newAssignmentCode).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api
        .put(
          `/assignmentcodes/${updateAssignmentCode._id}`,
          updateAssignmentCode
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      setSelectedAssignmentCode(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
    if (selectedAssignmentCodes.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedAssignmentCodes.length} bản ghi? hành động này không thể hoàn tác.`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedAssignmentCodes);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api
        .delete(`/assignmentcodes`, { data: { ids } })
        .then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setSelectedAssignmentCodes([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<AssignmentCodeInputType>) => {
    if (selectedAssignmentCode) {
      updateMutation.mutate({ ...values, _id: selectedAssignmentCode._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (AssignmentCode?: AssignmentCodeOutputType) => {
    if (AssignmentCode) {
      setSelectedAssignmentCode(AssignmentCode);
    } else {
      setSelectedAssignmentCode(null);
    }
    setOpen(true);
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    api
      .post("/assignmentcodes/importFile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        showSuccessAlert("Tải lên thành công");
        queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      })
      .catch((error) => {
        showErrorAlert(error.response?.data?.message || "Tải lên thất bại");
      });

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleExport = () => {
    api
      .post(
        "/assignmentcodes/exportFile",
        { data: filteredData },
        {
          responseType: "blob",
        }
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "danh_sach_ma_giao_khoan.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSuccessAlert("Xuất file thành công");
      })
      .catch((error) => {
        showErrorAlert(error.response?.data?.message || "Xuất file thất bại");
      });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("assignment-code-table");
    if (!printContent) {
      showErrorAlert("Không tìm thấy dữ liệu để in");
      return;
    }

    const originalContents = document.body.innerHTML;
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In danh sách mã giao khoán</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <h2>Danh sách mã giao khoán</h2>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      showErrorAlert("Không thể mở cửa sổ in. Vui lòng cho phép popup.");
    }
  };

  const columns: TableProps<AssignmentCodeOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã thiết bị</Typography>,
      dataIndex: "deviceCode",
      key: "deviceCode",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.deviceCode?.code}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.deviceCode?.code ?? "").localeCompare(
          b.deviceCode?.code ?? "",
          "vi",
          { sensitivity: "base" }
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
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
        <Typography sx={{ fontWeight: "bold" }}>Tên giao khoán</Typography>
      ),
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
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {record.price ? record.price.toLocaleString() : ""}
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

  const rowSelection: TableRowSelection<AssignmentCodeOutputType> = {
    selectedRowKeys: selectedAssignmentCodes,
    onChange: (newSelectedAssignmentCodes: React.Key[]) => {
      setSelectedAssignmentCodes(newSelectedAssignmentCodes);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Mã giao khoán</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Mã giao khoán
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
                  onClick={() => handleDelete()}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
                  }}
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
                  onClick={handleUpload}
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  style={{ display: "none" }}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileDownload />}
                  onClick={handleExport}
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
                  onClick={handlePrint}
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
          <div id="assignment-code-table">
            <Table<AssignmentCodeOutputType>
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
          </div>
        </Box>
      </Box>
      <AssignmentCodeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedAssignmentCode={selectedAssignmentCode}
      />
    </Box>
  );
}
