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
import MirrorRatioModal from "./MirrorRatioModal/MirrorRatioModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MirrorRatioType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import MirrorRatioService from "../../service/MirrorRatioService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import PageAction from "../../components/Common/PageAction";

export default function MirrorRatio() {
  const [open, setOpen] = useState(false);
  const [selectedMirrorRatio, setSelectedMirrorRatio] =
    useState<MirrorRatioType | null>(null);
  const [selectedMirrorRatios, setSelectedMirrorRatios] = useState<React.Key[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const {
    data: mirrorratios = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["mirrorratios", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/mirrorratios?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMirrorRatio: Partial<MirrorRatioType>) =>
      api.post("/mirrorratios", newMirrorRatio).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const exportExcel = useMutation({
    mutationFn: MirrorRatioService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMirrorRatio: Partial<MirrorRatioType>) =>
      api
        .put(`/mirrorratios/${updateMirrorRatio._id}`, updateMirrorRatio)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setOpen(false);
      setSelectedMirrorRatio(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDeleteSingle = (id: string) => {
    if (!id) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteSingleMutation.mutate(id);
      }
    });
  };

  const handleDeleteMultiple = () => {
    if (selectedMirrorRatios.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMirrorRatios.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedMirrorRatios as string[]);
      }
    });
  };

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/mirrorratios/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.delete(`/mirrorratios`, { data: { ids } }).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setSelectedMirrorRatios([]); // Clear selection sau khi xóa
      showSuccessAlert("Xóa thành công tất cả bản ghi đã chọn");
    },
    onError: (error: any) => {
      showErrorAlert("Có lỗi xảy ra khi xóa bản ghi");
    },
  });

  const handleSubmit = (values: Partial<MirrorRatioType>) => {
    if (selectedMirrorRatio) {
      updateMutation.mutate({ ...values, _id: selectedMirrorRatio._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MirrorRatio?: MirrorRatioType) => {
    if (MirrorRatio) {
      setSelectedMirrorRatio(MirrorRatio);
    } else {
      setSelectedMirrorRatio(null);
    }
    setOpen(true);
  };

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      MirrorRatioService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mirrorratios"] });
      setIsUploading(false);
      showSuccessAlert("Import thành công!");
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<MirrorRatioType>["columns"] = [
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
          Tỉ lệ gương than mềm
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
      title: <Typography sx={{ fontWeight: "bold" }}>sửa</Typography>,
      dataIndex: "actions",
      width: 100,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <IconButton onClick={() => handleOpen(record)}>
            <Edit color="primary" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<MirrorRatioType> = {
    selectedRowKeys: selectedMirrorRatios,
    onChange: (newSelectedMirrorRatios: React.Key[]) => {
      setSelectedMirrorRatios(newSelectedMirrorRatios);
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
        <Typography>Tỉ lệ gương than mềm</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Tỉ lệ gương than mềm
            </Typography>
            <PageAction
              selectedIds={selectedMirrorRatios}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMultipleMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={mirrorratios.totalDocs}
            />
          </Box>

          <CustomTable<MirrorRatioType>
            data={mirrorratios.data}
            total={mirrorratios.totalDocs}
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
      <MirrorRatioModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedMirrorRatio={selectedMirrorRatio}
      />
    </Box>
  );
}
