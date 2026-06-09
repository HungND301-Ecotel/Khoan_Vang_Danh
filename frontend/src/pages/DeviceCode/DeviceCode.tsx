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
import React, { useRef, useState } from "react";
import DeviceCodeModal from "./DeviceCodeModal/DeviceCodeModal";
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
import custom_theme from "../../theme";
import DeviceCodeService from "../../service/DeviceCodeService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function DeviceCode() {
  const [open, setOpen] = useState(false);
  const [selectedDeviceCode, setSelectedDeviceCode] =
    useState<DeviceCodeType | null>(null);
  const [selectedDeviceCodes, setSelectedDeviceCodes] = useState<React.Key[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const {
    data: devicecodes = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["devicecodes", searchValue, page, limit],
    queryFn: () =>
      api
        .get(`/devicecodes?q=${searchValue}&page=${page}&limit=${limit}`)
        .then((res) => res.data.data),
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
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
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
      `Bạn có muốn xóa ${selectedDeviceCodes.length} bản ghi? hành động này không thể hoàn tác.`,
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

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      DeviceCodeService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["devicecodes"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

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
                  ${devicecodes
                    .map(
                      (devicecode: DeviceCodeType, index: number) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${devicecode.code || ""}</td>
                    </tr>
                  `,
                    )
                    .join("")}
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

    showConfirmAlert(
      "Bạn có muốn gửi danh sách mã thiết bị đã chọn qua email?",
    ).then((result) => {
      if (result.isConfirmed) {
        const selectedDeviceCodeData = devicecodes.filter(
          (devicecode: DeviceCodeType) =>
            selectedDeviceCodes.includes(devicecode._id as React.Key),
        );

        api
          .post("/devicecodes/sendEmail", { data: selectedDeviceCodeData })
          .then((response) => {
            showSuccessAlert("Gửi email thành công!");
          })
          .catch((error) => {
            showErrorAlert(
              error.response?.data?.message || "Gửi email thất bại",
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
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã thiết bị</Typography>,
      dataIndex: "code",
      key: "code",
      render: (_, record) => <Typography>{record.code}</Typography>,
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

  const handleClearSearch = () => {
    setSearchValue("");
  };

  return (
    <Box
      sx={{
        px: 5, // horizontal = 32px
        py: 1, // vertical = 8px
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Mã thiết bị</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Mã thiết bị
            </Typography>
            <PageAction
              selectedIds={selectedDeviceCodes}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleSendEmail={handleSendEmail}
              handlePrint={handlePrint}
              isLoading={isLoading}
              totalItems={devicecodes.totalDocs}
              handleClearSearch={handleClearSearch}
            />
          </Box>
          <CustomTable<DeviceCodeType>
            data={devicecodes.data}
            total={devicecodes.totalDocs}
            page={page}
            limit={limit}
            columns={columns}
            rowSelection={rowSelection}
            onPageChange={(p, ps) => {
              setPage(p);
              setLimit(ps);
            }}
            isLoading={isLoading}
            searchValue={searchValue}
            handleClearSearch={handleClearSearch}
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
