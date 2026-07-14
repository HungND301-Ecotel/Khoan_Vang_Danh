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
import CrossSectionModal from "./CrossSectionModal/CrossSectionModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CrossSectionOutputType, CrossSectionInputType } from "../../types";
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
import CrossSectionService from "../../service/CrossSectionService";
import { parseAxiosError } from "../../utils/handleApiError";
import { ShowAlertImport } from "../../utils/AlertImport"
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function CrossSection() {
  const [open, setOpen] = useState(false);
  const [selectedCrossSection, setSelectedCrossSection] =
    useState<CrossSectionOutputType | null>(null);
  const [selectedCrossSections, setSelectedCrossSections] = useState<
    React.Key[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<CrossSectionInputType>
  >(setOpen, "Tiết diện lò xén");

  const {
    data: crosssections = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["crosssections", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/crosssections?q=${searchValue}&page=${page}&limit=${limit}`
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCrossSection: Partial<CrossSectionInputType>) =>
      api.post("/crosssections", newCrossSection).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateCrossSection: Partial<CrossSectionInputType>) =>
      api
        .put(`/crosssections/${updateCrossSection._id}`, updateCrossSection)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setOpen(false);
      clearMinimize();
      setSelectedCrossSection(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      CrossSectionService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setIsUploading(false);
      ShowAlertImport(data)
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: CrossSectionService.exportFile,
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedCrossSections.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedCrossSections.length} bản ghi đã chọn?`
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedCrossSections);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/crosssections`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosssections"] });
      setSelectedCrossSections([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<CrossSectionInputType>) => {
    const targetId = selectedCrossSection?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (crossSection?: CrossSectionOutputType) => {
    if (crossSection) {
      setSelectedCrossSection(crossSection);
    } else {
      setSelectedCrossSection(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<CrossSectionOutputType>["columns"] = [
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
        <Typography sx={{ fontWeight: "bold" }}>Tiết diện lò xén</Typography>
      ),
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
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "uom",
      key: "uom",
      render: (_, record) => <Typography>{record.uom?.name}</Typography>,
      sorter: (a, b) =>
        (a.uom?.name ?? "").localeCompare(b.uom?.name ?? "", "vi", {
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

  const rowSelection: TableRowSelection<CrossSectionOutputType> = {
    selectedRowKeys: selectedCrossSections,
    onChange: (newSelectedCrossSections: React.Key[]) => {
      setSelectedCrossSections(newSelectedCrossSections);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedCrossSections}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={crosssections.totalDocs}
            />
          </Box>

          <CustomTable<CrossSectionOutputType>
            data={crosssections.data}
            total={crosssections.totalDocs}
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
      <CrossSectionModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedCrossSection={selectedCrossSection}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
