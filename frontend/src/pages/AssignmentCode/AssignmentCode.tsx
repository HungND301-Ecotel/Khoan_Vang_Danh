import { Edit } from "@mui/icons-material";
import { Box, Breadcrumbs, IconButton, Typography } from "@mui/material";
import React, { useState, useMemo, useEffect, useRef } from "react";
import AssignmentCodeModal from "./AssignmentCodeModal/AssignmentCodeModal";
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
import custom_theme from "../../theme";
import AssignmentCodeService from "../../service/AssignmentCodeService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function AssignmentCode() {
  const [open, setOpen] = useState(false);
  const [selectedAssignmentCode, setSelectedAssignmentCode] =
    useState<AssignmentCodeOutputType | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<AssignmentCodeInputType>
  >(setOpen, "Mã giao khoán");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    // Gọi trực tiếp click() trên phần tử input bị ẩn
    fileInputRef.current?.click();
  };

  const queryClient = useQueryClient();

  const {
    data: assignmentcodes = {
      totalDocs: 0,
      results: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["assignmentcodes", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/assignmentcodes?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api.post("/assignmentcodes", newAssignmentCode).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: AssignmentCodeService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      AssignmentCodeService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api
        .put(
          `/assignmentcodes/${updateAssignmentCode._id}`,
          updateAssignmentCode,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentcodes"] });
      setOpen(false);
      clearMinimize();
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
      `Bạn có muốn xóa ${selectedAssignmentCodes.length} bản ghi? hành động này không thể hoàn tác.`,
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
    const targetId = selectedAssignmentCode?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
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

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  // Custom empty state component

  const columns: TableProps<AssignmentCodeOutputType>["columns"] = [
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
      dataIndex: "deviceCode",
      key: "deviceCode",
      render: (_, record) => <Typography>{record.deviceCode?.code}</Typography>,
      sorter: (a, b) =>
        (a.deviceCode?.code ?? "").localeCompare(
          b.deviceCode?.code ?? "",
          "vi",
          { sensitivity: "base" },
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
      dataIndex: "code",
      key: "code",
      render: (_, record) => <Typography>{record.code}</Typography>,
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
      render: (value, record) => <Typography>{value}</Typography>,
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "uom",
      key: "uom",
      render: (_, record) => <Typography>{record.uom?.name}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Đơn giá kế hoạch</Typography>
      ),
      dataIndex: "plannedPrice",
      key: "plannedPrice",
      render: (_, record) => (
        <Typography>{formattedPrice(record.plannedPrice)}</Typography>
      ),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Đơn giá thực hiện</Typography>
      ),
      dataIndex: "executionPrice",
      key: "executionPrice",
      render: (_, record) => (
        <Typography>{formattedPrice(record.executionPrice)}</Typography>
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
    <Box
      sx={{
        px: 5, // horizontal = 32px
        py: 1, // vertical = 8px
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Mã giao khoán</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Mã giao khoán
            </Typography>
            <PageAction
              selectedIds={selectedAssignmentCodes}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              totalItems={assignmentcodes.totalDocs}
              isLoading={isLoading}
            />
          </Box>
          <CustomTable<AssignmentCodeOutputType>
            data={assignmentcodes.data}
            total={assignmentcodes.totalDocs}
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
      <AssignmentCodeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedAssignmentCode={selectedAssignmentCode}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
