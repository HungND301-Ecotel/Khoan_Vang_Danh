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
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import React, { useState, useMemo, useEffect, useRef } from "react";
import LengthModal from "./LengthModal/LengthModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LengthType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps } from "antd";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import LengthService from "../../service/LengthService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function Length() {
  const [open, setOpen] = useState(false);
  const [selectedLength, setSelectedLength] = useState<LengthType | null>(null);
  const [selectedLengths, setSelectedLengths] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<LengthType>
  >(setOpen, "Chiều dài lò");

  const {
    data: length = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["length", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/length?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newLength: Partial<LengthType>) =>
      api.post("/length", newLength).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateLength: Partial<LengthType>) =>
      api
        .put(`/length/${updateLength._id}`, updateLength)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setOpen(false);
      clearMinimize();
      setSelectedLength(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      LengthService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: LengthService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDelete = (id?: string) => {
    if (selectedLengths.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedLengths.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedLengths);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/length`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["length"] });
      setSelectedLengths([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<LengthType>) => {
    const targetId = selectedLength?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (lengthItem?: LengthType) => {
    if (lengthItem) {
      setSelectedLength(lengthItem);
    } else {
      setSelectedLength(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<LengthType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Chiều dài lò</Typography>,
      dataIndex: "name",
      key: "name",
      render: (_, record) => <Typography>{record.name}</Typography>,
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

  const rowSelection: TableRowSelection<LengthType> = {
    selectedRowKeys: selectedLengths,
    onChange: (newSelectedLengths: React.Key[]) => {
      setSelectedLengths(newSelectedLengths);
    },
  };

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Chiều dài lò</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Chiều dài lò
            </Typography> */}
            <PageAction
              selectedIds={selectedLengths}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={length.totalDocs}
            />
          </Box>

          <CustomTable<LengthType>
            data={length.data}
            total={length.totalDocs}
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
      <LengthModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedLength={selectedLength}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
