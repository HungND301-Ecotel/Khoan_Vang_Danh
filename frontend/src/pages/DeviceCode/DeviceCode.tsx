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
import DeviceCodeModal from "../../components/DeviceCodeModal/DeviceCodeModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceCodeType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from '../../theme';
import DeviceCodeService from "../../service/DeviceCodeService";
import { parseAxiosError } from "../../utils/handleApiError";

export default function DeviceCode() {
  const [open, setOpen] = useState(false);
  const [selectedDeviceCode, setSelectedDeviceCode] =
    useState<DeviceCodeType | null>(null);
  const [selectedDeviceCodes, setSelectedDeviceCodes] = useState<React.Key[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
 const { data: devicecodes = [] } = useQuery({
  queryKey: ["devicecodes", searchValue],
  queryFn: () =>
    api.get(`/devicecodes?q=${searchValue}`).then((res) =>
      res.data.data.filter((item: DeviceCodeType) =>
        (item.code ?? "").toLowerCase().includes(searchValue.toLowerCase())
      )
    ),
});

  const createMutation = useMutation({
    mutationFn: (newDeviceCode: Partial<DeviceCodeType>) =>
      api.post("/devicecodes", newDeviceCode).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devicecodes"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: DeviceCodeService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error)
      showErrorAlert(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updateDeviceCode: Partial<DeviceCodeType>) =>
      api
        .put(`/devicecodes/${updateDeviceCode._id}`, updateDeviceCode)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devicecodes"] });
      setOpen(false);
      setSelectedDeviceCode(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleDelete = () => {
    if (selectedDeviceCodes.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedDeviceCodes.length} bản ghi? hành động này không thể hoàn tác.`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedDeviceCodes);
      }
    });
  };
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api
        .delete(`/devicecodes`, { data: { ids } })
        .then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["devicecodes"] });
      setSelectedDeviceCodes([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleSubmit = (values: Partial<DeviceCodeType>) => {
    if (selectedDeviceCode) {
      updateMutation.mutate({ ...values, _id: selectedDeviceCode._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (DeviceCode?: DeviceCodeType) => {
    if (DeviceCode) {
      setSelectedDeviceCode(DeviceCode);
    } else {
      setSelectedDeviceCode(null);
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
              .post("/devicecodes/importFile", formData, {
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

                showSuccessAlert(message);
                queryClient.invalidateQueries({ queryKey: ["devicecodes"] });
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

  const handleExport = () => {
    showConfirmAlert("Bạn có muốn xuất dữ liệu ra file Excel?").then((result) => {
      if (result.isConfirmed) {
        api
          .post("/devicecodes/exportFile", { data: devicecodes }, { responseType: "blob" })
          .then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "danh_sach_ma_thiet_bi.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSuccessAlert("Xuất file thành công!");
          })
          .catch((error) => {
            showErrorAlert(
              error.response?.data?.message || "Xuất file thất bại"
            );
          });
      }
    });
  };

  const handlePrint = () => {
    showConfirmAlert("Bạn có muốn in dữ liệu mã thiết bị?").then((result) => {
      if (result.isConfirmed) {
        const printContent = `
          <html>
            <head>
              <title>Danh sách mã thiết bị</title>
              <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>Danh sách mã thiết bị</h1>
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã thiết bị</th>
                  </tr>
                </thead>
                <tbody>
                  ${devicecodes.map((devicecode: DeviceCodeType, index: number) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${devicecode.code || ""}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;
        
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          // printWindow.close(); 
        }
      }
    });
  };

  const handleSendEmail = () => {
    if (selectedDeviceCodes.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một mã thiết bị để gửi");
      return;
    }
    
    showConfirmAlert("Bạn có muốn gửi danh sách mã thiết bị đã chọn qua email?").then((result) => {
      if (result.isConfirmed) {
        const selectedDeviceCodeData = devicecodes.filter((devicecode: DeviceCodeType) => 
          selectedDeviceCodes.includes(devicecode._id as React.Key)
        );
        
        api
          .post("/devicecodes/sendEmail", { data: selectedDeviceCodeData })
          .then((response) => {
            showSuccessAlert("Gửi email thành công!");
          })
          .catch((error) => {
            showErrorAlert(
              error.response?.data?.message || "Gửi email thất bại"
            );
          });
      }
    });
  };

  const columns: TableProps<DeviceCodeType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã thiết bị</Typography>,
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

  const rowSelection: TableRowSelection<DeviceCodeType> = {
    selectedRowKeys: selectedDeviceCodes,
    onChange: (newSelectedDeviceCodes: React.Key[]) => {
      setSelectedDeviceCodes(newSelectedDeviceCodes);
    },
  };

  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Mã thiết bị</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main }}>
              Mã thiết bị
            </Typography>
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
                  onClick={() => handleDelete()}
                  disabled={selectedDeviceCodes.length === 0}
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
                  {deleteMutation.isPending
                    ? "Đang xóa..."
                    : `Xóa (${selectedDeviceCodes.length})`}
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
                  onClick={handleImport}
                >
                  Tải lên
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileDownload />}
                  onClick={() => exportExcel.mutate()}
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
                  onClick={handleExport}
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
                  onClick={handlePrint}
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
                  onClick={handleSendEmail}
                >
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>
          <Table<DeviceCodeType>
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
            dataSource={devicecodes}
          />
        </Box>
      </Box>
      <DeviceCodeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedDeviceCode={selectedDeviceCode}
      />
    </Box>
  );
}