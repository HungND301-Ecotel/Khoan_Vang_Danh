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
import CurbSlopeModal from "./CurbSlopeModal/CurbSlopeModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurbSlopeType } from "../../types";
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
import CurbSlopeService from "../../service/CurbSlopeService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function CurbSlope() {
  const [open, setOpen] = useState(false);
  const [selectedCurbSlope, setSelectedCurbSlope] =
    useState<CurbSlopeType | null>(null);
  const [selectedCurbSlopes, setSelectedCurbSlopes] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<CurbSlopeType>
  >(setOpen, "Độ dốc vỉa");

  const {
    data: curbslopes = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["curbslopes", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/curbslopes?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCurbSlope: Partial<CurbSlopeType>) =>
      api.post("/curbslopes", newCurbSlope).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curbslopes"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateCurbSlope: Partial<CurbSlopeType>) =>
      api
        .put(`/curbslopes/${updateCurbSlope._id}`, updateCurbSlope)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curbslopes"] });
      setOpen(false);
      clearMinimize();
      setSelectedCurbSlope(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      CurbSlopeService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["curbslopes"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: CurbSlopeService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedCurbSlopes.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedCurbSlopes.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedCurbSlopes as string[]);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.delete(`/curbslopes`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curbslopes"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<CurbSlopeType>) => {
    const targetId = selectedCurbSlope?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (curbSlope?: CurbSlopeType) => {
    if (curbSlope) {
      setSelectedCurbSlope(curbSlope);
    } else {
      setSelectedCurbSlope(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<CurbSlopeType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Độ dốc vỉa</Typography>,
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

  const rowSelection: TableRowSelection<CurbSlopeType> = {
    selectedRowKeys: selectedCurbSlopes,
    onChange: (newSelectedCurbSlopes: React.Key[]) => {
      setSelectedCurbSlopes(newSelectedCurbSlopes);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Độ dốc vỉa
            </Typography> */}
            <PageAction
              selectedIds={selectedCurbSlopes}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={curbslopes.totalDocs}
            />
          </Box>
          <CustomTable<CurbSlopeType>
            data={curbslopes.data}
            total={curbslopes.totalDocs}
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
      <CurbSlopeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedCurbSlope={selectedCurbSlope}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
