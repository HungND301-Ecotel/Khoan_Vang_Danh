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
import MiningTechModal from "./MiningTechModal/MiningTechModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MiningtechType } from "../../types";
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
import MiningTechService from "../../service/MiningTechService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function MiningTech() {
  const [open, setOpen] = useState(false);
  const [selectedMiningTech, setSelectedMiningTech] =
    useState<MiningtechType | null>(null);
  const [selectedMiningTechs, setSelectedMiningTechs] = useState<React.Key[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<MiningtechType>
  >(setOpen, "Công nghệ khai thác");

  const {
    data: miningtechs = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["miningtechs", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/miningtechs?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMiningTech: Partial<MiningtechType>) =>
      api.post("/miningtechs", newMiningTech).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      MiningTechService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: MiningTechService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMiningTech: Partial<MiningtechType>) =>
      api
        .put(`/miningtechs/${updateMiningTech._id}`, updateMiningTech)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      setOpen(false);
      clearMinimize();
      setSelectedMiningTech(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });


  const handleDeleteMultiple = () => {
    if (selectedMiningTechs.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMiningTechs.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedMiningTechs);
      }
    });
  };
  
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/miningtechs`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      setSelectedMiningTechs([]);
      queryClient.invalidateQueries({ queryKey: ["miningtechs"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MiningtechType>) => {
    const targetId = selectedMiningTech?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MiningTech?: MiningtechType) => {
    if (MiningTech) {
      setSelectedMiningTech(MiningTech);
    } else {
      setSelectedMiningTech(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<MiningtechType>["columns"] = [
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
          Mã công nghệ khai thác
        </Typography>
      ),
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
        <Typography sx={{ fontWeight: "bold" }}>
          Tên công nghệ khai thác
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

  const rowSelection: TableRowSelection<MiningtechType> = {
    selectedRowKeys: selectedMiningTechs,
    onChange: (newSelectedMiningTechs: React.Key[]) => {
      setSelectedMiningTechs(newSelectedMiningTechs);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
                            Công nghệ khai thác
                        </Typography>  */}
            <PageAction
              selectedIds={selectedMiningTechs}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={miningtechs.totalDocs}
            />
          </Box>

          <CustomTable<MiningtechType>
            data={miningtechs.data}
            total={miningtechs.totalDocs}
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
      <MiningTechModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhaseGroup={selectedMiningTech}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />

    </Box>
  );
}
