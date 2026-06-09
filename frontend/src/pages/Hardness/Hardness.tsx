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
import React, { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardnessType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps } from "antd";
import CustomTable from "../../components/CustomTable/CustomTable";

import HardnessService from "../../service/HardnessService";
import { parseAxiosError } from "../../utils/handleApiError";
import HardnessModal from "./HardnessModal/HardnessModal";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function Hardness() {
  const [open, setOpen] = useState(false);
  const [selectedHardness, setSelectedHardness] = useState<HardnessType | null>(
    null,
  );
  const [selectedHardnesses, setSelectedHardnesses] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const {
    data: hardness = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["hardness", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/hardness?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newHardness: Partial<HardnessType>) =>
      api.post("/hardness", newHardness).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateHardness: Partial<HardnessType>) =>
      api
        .put(`/hardness/${updateHardness._id}`, updateHardness)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      setOpen(false);
      setSelectedHardness(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedHardnesses.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedHardnesses.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedHardnesses);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/hardness`, { data: { ids: ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<HardnessType>) => {
    if (selectedHardness) {
      updateMutation.mutate({ ...values, _id: selectedHardness._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (hardness?: HardnessType) => {
    if (hardness) {
      setSelectedHardness(hardness);
    } else {
      setSelectedHardness(null);
    }
    setOpen(true);
  };

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      HardnessService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hardness"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: HardnessService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<HardnessType>["columns"] = [
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
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Độ cứng của than/ đá (f)
        </Typography>
      ),
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

  const rowSelection: TableRowSelection<HardnessType> = {
    selectedRowKeys: selectedHardnesses,
    onChange: (newSelectedHardnesses: React.Key[]) => {
      setSelectedHardnesses(newSelectedHardnesses);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedHardnesses}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={hardness.totalDocs}
            />
          </Box>

          <CustomTable<HardnessType>
            data={hardness.data}
            total={hardness.totalDocs}
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
      <HardnessModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedHardness={selectedHardness}
      />

    </Box>
  );
}
