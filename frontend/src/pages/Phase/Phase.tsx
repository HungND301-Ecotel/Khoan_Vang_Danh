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
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import React, { useState, useMemo, useEffect, useRef } from "react";
import PhaseModal from "./PhaseModal/PhaseModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhaseOutputType, PhaseInputType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps } from "antd";
import custom_theme from "../../theme";
import { parseAxiosError } from "../../utils/handleApiError";
import PhaseService from "../../service/PhaseService";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport"
import PageAction from "../../components/Common/PageAction";


interface PhaseProps {
  searchValue?: string;
}

export default function Phase({ searchValue: parentSearchValue }: PhaseProps) {
  const [open, setOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseOutputType | null>(
    null
  );
  const [selectedPhases, setSelectedPhases] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const queryClient = useQueryClient();

  const {
    data: phases = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["phases", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/phases?q=${searchValue}&page=${page}&limit=${limit}`
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      PhaseService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      setIsUploading(false);
      ShowAlertImport(data)
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const createMutation = useMutation({
    mutationFn: (newPhase: Partial<PhaseInputType>) =>
      api.post("/phases", newPhase).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: PhaseService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatePhase: Partial<PhaseInputType>) =>
      api
        .put(`/phases/${updatePhase._id}`, updatePhase)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      setOpen(false);
      setSelectedPhase(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });


  const handleDeleteMultiple = () => {
    if (selectedPhases.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedPhases.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedPhases);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/phases`, { data: { ids: ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<PhaseInputType>) => {
    if (selectedPhase) {
      updateMutation.mutate({ ...values, _id: selectedPhase._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (phase?: PhaseOutputType) => {
    if (phase) {
      setSelectedPhase(phase);
    } else {
      setSelectedPhase(null);
    }
    setOpen(true);
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<PhaseOutputType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Mã công đoạn</Typography>,
      dataIndex: "code",
      key: "code",
      render: (_, record) => (
        <Typography >{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên công đoạn</Typography>,
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Typography>{record.name}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Nhóm công đoạn</Typography>
      ),
      dataIndex: "phaseGroup",
      key: "phaseGroup",
      render: (_, record) => (
        <Typography>
          {record.phaseGroup?.name}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.phaseGroup?.name ?? "").localeCompare(
          b.phaseGroup?.name ?? "",
          "vi",
          { sensitivity: "base" }
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

  const rowSelection: TableRowSelection<PhaseOutputType> = {
    selectedRowKeys: selectedPhases,
    onChange: (newSelectedPhases: React.Key[]) => {
      setSelectedPhases(newSelectedPhases);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedPhases}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={phases.totalDocs}
            />
          </Box>

          <CustomTable<PhaseOutputType>
            data={phases.data}
            total={phases.totalDocs}
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
      <PhaseModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhase={selectedPhase}
      />
    </Box>
  );
}
