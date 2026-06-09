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
import StepModal from "./StepModal/StepModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StepType } from "../../types";
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
import StepService from "../../service/StepService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function Step() {
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<StepType | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: steps = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["steps", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/steps?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newStep: Partial<StepType>) =>
      api.post("/steps", newStep).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateStep: Partial<StepType>) =>
      api.put(`/steps/${updateStep._id}`, updateStep).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setOpen(false);
      setSelectedStep(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
      if (selectedSteps.length === 0) {
        showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
        return;
      }

      showConfirmAlert(
        `Bạn có muốn xóa ${selectedSteps.length} bản ghi đã chọn?`,
      ).then((result) => {
        if (result.isConfirmed) {
          deleteMutation.mutate(selectedSteps);
        }
      });
  };
  
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/steps`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      showSuccessAlert("Xóa thành công");
      setSelectedSteps([]);
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      StepService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: StepService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleSubmit = (values: Partial<StepType>) => {
    if (selectedStep) {
      updateMutation.mutate({ ...values, _id: selectedStep._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (step?: StepType) => {
    if (step) {
      setSelectedStep(step);
    } else {
      setSelectedStep(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<StepType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Bước chống</Typography>,
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

  const rowSelection: TableRowSelection<StepType> = {
    selectedRowKeys: selectedSteps,
    onChange: (newSelectedSteps: React.Key[]) => {
      setSelectedSteps(newSelectedSteps);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Bước chống
            </Typography> */}
            <PageAction
              selectedIds={selectedSteps}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={steps.totalDocs}
            />
          </Box>
          <CustomTable<StepType>
            data={steps.data}
            total={steps.totalDocs}
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
      <StepModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedStep={selectedStep}
      />
    </Box>
  );
}
