import {
  Add,
  ArrowDropDown,
  Delete,
  Edit,
  Search,
  Mail,
  Print,
  FileDownload,
  FileUpload,
  FilterList,
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
import RockRatioModal from "./RockRatioModal/RockRatioModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RockRatioType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import RockRatioService from "../../service/RockRatioService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function RockRatio() {
  const [open, setOpen] = useState(false);
  const [selectedRockRatio, setSelectedRockRatio] =
    useState<RockRatioType | null>(null);
  const [selectedRockRatios, setSelectedRockRatios] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const {
    data: rockratios = {
      totalDocs: 0,
      results: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["rockratios", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/rockratios?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newRockRatio: Partial<RockRatioType>) =>
      api.post("/rockratios", newRockRatio).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateRockRatio: Partial<RockRatioType>) =>
      api
        .put(`/rockratios/${updateRockRatio._id}`, updateRockRatio)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setOpen(false);
      setSelectedRockRatio(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return api.delete(`/rockratios`, { data: { ids } }).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setSelectedRockRatios([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    },
  });
  const exportExcel = useMutation({
    mutationFn: RockRatioService.exportFile,
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
      RockRatioService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });
  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/rockratios/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rockratios"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedRockRatios.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    const confirmMessage =
      selectedRockRatios.length === 1
        ? "Bạn có muốn xóa 1 bản ghi? Hành động này không thể hoàn tác."
        : `Bạn có muốn xóa ${selectedRockRatios.length} bản ghi? Hành động này không thể hoàn tác.`;

    showConfirmAlert(confirmMessage).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedRockRatios as string[]);
      }
    });
  };

  const handleSubmit = (values: Partial<RockRatioType>) => {
    if (selectedRockRatio) {
      updateMutation.mutate({ ...values, _id: selectedRockRatio._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (RockRatio?: RockRatioType) => {
    if (RockRatio) {
      setSelectedRockRatio(RockRatio);
    } else {
      setSelectedRockRatio(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<RockRatioType>["columns"] = [
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
          Tỉ lệ đá lẫn trong gương
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

  const rowSelection: TableRowSelection<RockRatioType> = {
    selectedRowKeys: selectedRockRatios,
    onChange: (newSelectedRockRatios: React.Key[]) => {
      setSelectedRockRatios(newSelectedRockRatios);
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
        <Typography>Tỉ lệ đá lẫn trong gương</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Tỉ lệ đá lẫn trong gương
            </Typography>
            <PageAction
              selectedIds={selectedRockRatios}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMultipleMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={rockratios.totalDocs}
            />
          </Box>
          <CustomTable<RockRatioType>
            data={rockratios.data}
            total={rockratios.totalDocs}
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
      <RockRatioModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedRockRatio={selectedRockRatio}
      />
    </Box>
  );
}
