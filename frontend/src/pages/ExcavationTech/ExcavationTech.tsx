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
import ExcavationTechModal from "./ExcavationTechModal/ExcavationTechModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExcavationTechType } from "../../types";
import api from "../../config/api.config";
import ExcavationTechService from "../../service/ExcavationTechService";
import { parseAxiosError } from "../../utils/handleApiError";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function ExcavationTech() {
  const [open, setOpen] = useState(false);
  const [selectedExcavationTech, setSelectedExcavationTech] =
    useState<ExcavationTechType | null>(null);
  const [selectedExcavationTechs, setSelectedExcavationTechs] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: excavationtechs = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["excavationtechs", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/excavationtechs?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      ExcavationTechService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: ExcavationTechService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (newExcavationTech: Partial<ExcavationTechType>) =>
      api.post("/excavationtechs", newExcavationTech).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateExcavationTech: Partial<ExcavationTechType>) =>
      api
        .put(
          `/excavationtechs/${updateExcavationTech._id}`,
          updateExcavationTech,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setOpen(false);
      setSelectedExcavationTech(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedExcavationTechs.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedExcavationTechs.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
       deleteMultipleMutation.mutate(selectedExcavationTechs);
      }
    });
  };

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/excavationtechs`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excavationtechs"] });
      setSelectedExcavationTechs([]);
      showSuccessAlert(
        `Đã xóa ${selectedExcavationTechs.length} bản ghi thành công`,
      );
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<ExcavationTechType>) => {
    if (selectedExcavationTech) {
      updateMutation.mutate({ ...values, _id: selectedExcavationTech._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (ExcavationTech?: ExcavationTechType) => {
    if (ExcavationTech) {
      setSelectedExcavationTech(ExcavationTech);
    } else {
      setSelectedExcavationTech(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<ExcavationTechType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Công nghệ xúc</Typography>,
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

  const rowSelection: TableRowSelection<ExcavationTechType> = {
    selectedRowKeys: selectedExcavationTechs,
    onChange: (newSelectedExcavationTechs: React.Key[]) => {
      setSelectedExcavationTechs(newSelectedExcavationTechs);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedExcavationTechs}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMultipleMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={excavationtechs.totalDocs}
            />
          </Box>

          <CustomTable<ExcavationTechType>
            data={excavationtechs.data}
            total={excavationtechs.totalDocs}
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
      <ExcavationTechModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedExcavationTech={selectedExcavationTech}
      />
    </Box>
  );
}
