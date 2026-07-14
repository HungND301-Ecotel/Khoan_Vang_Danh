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
} from "@mui/material";
import React, { useState, useMemo, useEffect, useRef } from "react";
import PhaseGroupModal from "./PhaseGroupModal/PhaseGroupModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhaseGroupType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";
import custom_theme from "../../theme";
import PhaseGroupService from "../../service/PhaseGroupService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

interface PhaseGroupProps {
  searchValue?: string;
}

export default function PhaseGroup({
  searchValue: parentSearchValue,
}: PhaseGroupProps) {
  const [open, setOpen] = useState(false);
  const [selectedPhaseGroup, setSelectedPhaseGroup] =
    useState<PhaseGroupType | null>(null);
  const [selectedPhaseGroups, setSelectedPhaseGroups] = useState<React.Key[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Use parent search value if provided, otherwise use local search

  const queryClient = useQueryClient();
  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<PhaseGroupType>
  >(setOpen, "Nhóm công đoạn");

  const {
    data: phasegroups = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["phasegroups", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/phasegroups?q=${searchValue}&page=${page}&limit=${limit}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newPhaseGroup: Partial<PhaseGroupType>) =>
      api.post("/phasegroups", newPhaseGroup).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const exportExcel = useMutation({
    mutationFn: PhaseGroupService.exportFile,
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
      PhaseGroupService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatePhaseGroup: Partial<PhaseGroupType>) =>
      api
        .put(`/phasegroups/${updatePhaseGroup._id}`, updatePhaseGroup)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      clearMinimize();
      setSelectedPhaseGroup(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/phasegroups`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setSelectedPhaseGroups([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedPhaseGroups.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    const confirmMessage = `Bạn có muốn xóa ${selectedPhaseGroups.length} bản ghi? Hành động này không thể hoàn tác.`;

    showConfirmAlert(confirmMessage).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedPhaseGroups as string[]);
      }
    });
  };

  const handleSubmit = (values: Partial<PhaseGroupType>) => {
    const targetId = selectedPhaseGroup?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (phaseGroup?: PhaseGroupType) => {
    if (phaseGroup) {
      setSelectedPhaseGroup(phaseGroup);
    } else {
      setSelectedPhaseGroup(null);
    }
    setOpen(true);
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };
  const columns: TableProps<PhaseGroupType>["columns"] = [
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
        <Typography sx={{ fontWeight: "bold" }}>Mã nhóm công đoạn</Typography>
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
        <Typography sx={{ fontWeight: "bold" }}>Tên nhóm công đoạn</Typography>
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
      dataIndex: "actions",
      width: 120,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <IconButton onClick={() => handleOpen(record)}>
            <Edit color="primary" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<PhaseGroupType> = {
    selectedRowKeys: selectedPhaseGroups,
    onChange: (newSelectedPhaseGroups: React.Key[]) => {
      setSelectedPhaseGroups(newSelectedPhaseGroups);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedPhaseGroups}
              handleDelete={handleDeleteMultiple}
              deleteMutation={deleteMultipleMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={phasegroups.totalDocs}
            />
          </Box>

          <CustomTable<PhaseGroupType>
            data={phasegroups.data}
            total={phasegroups.totalDocs}
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
      <PhaseGroupModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhaseGroup={selectedPhaseGroup}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
