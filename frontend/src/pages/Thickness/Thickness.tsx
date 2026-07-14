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
import ThicknessModal from "./ThicknessModal/ThicknessModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThicknessType } from "../../types";
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
import ThicknessService from "../../service/ThicknessService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function Thickness() {
  const [open, setOpen] = useState(false);
  const [selectedThickness, setSelectedThickness] =
    useState<ThicknessType | null>(null);
  const [selectedThicknesses, setSelectedThicknesses] = useState<React.Key[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<ThicknessType>
  >(setOpen, "Độ dày vỉa");

  const {
    data: thickness = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["thickness", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/thickness?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newThickness: Partial<ThicknessType>) =>
      api.post("/thickness", newThickness).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thickness"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateThickness: Partial<ThicknessType>) =>
      api
        .put(`/thickness/${updateThickness._id}`, updateThickness)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thickness"] });
      setOpen(false);
      clearMinimize();
      setSelectedThickness(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      ThicknessService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["thickness"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: ThicknessService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });


  const handleDeleteMultiple = () => {
    if (selectedThicknesses.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedThicknesses.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedThicknesses);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/thickness`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thickness"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<ThicknessType>) => {
    const targetId = selectedThickness?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (thickness?: ThicknessType) => {
    if (thickness) {
      setSelectedThickness(thickness);
    } else {
      setSelectedThickness(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<ThicknessType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Độ dày vỉa</Typography>,
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

  const rowSelection: TableRowSelection<ThicknessType> = {
    selectedRowKeys: selectedThicknesses,
    onChange: (newSelectedThicknesses: React.Key[]) => {
      setSelectedThicknesses(newSelectedThicknesses);
    },
  };

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Độ dày vỉa</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Độ dày vỉa
            </Typography> */}
            <PageAction
              selectedIds={selectedThicknesses}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={thickness.totalDocs}
            />
          </Box>

          <CustomTable<ThicknessType>
            data={thickness.data}
            total={thickness.totalDocs}
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
      <ThicknessModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedThickness={selectedThickness}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
