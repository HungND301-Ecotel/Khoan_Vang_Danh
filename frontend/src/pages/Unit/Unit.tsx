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
} from "@mui/material";
import React, { useRef, useState } from "react";
import UnitModal from "./UnitModal/UnitModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UnitType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import UnitService from "../../service/UnitService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import { useDebounce } from "../../hooks/useDebounce";
import PageAction from "../../components/Common/PageAction";

export default function Unit() {
  const [open, setOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const {
    data: units = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["units", searchValue, page, limit],
    queryFn: () =>
      api
        .get(`/units?q=${searchValue}&page=${page}&limit=${limit}`)
        .then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newUnit: Partial<UnitType>) =>
      api.post("/units", newUnit).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const [, setProgress] = useState(0);
  const [, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      UnitService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0); // Reset tiến trình khi bắt đầu
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: UnitService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateUnit: Partial<UnitType>) =>
      api.put(`/units/${updateUnit._id}`, updateUnit).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setOpen(false);
      setSelectedUnit(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleDelete = () => {
    if (selectedUnits.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedUnits.length} bản ghi? hành động này không thể hoàn tác.`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedUnits);
      }
    });
  };
  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/units`, { data: { ids } }).then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setSelectedUnits([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const handleSubmit = (values: Partial<UnitType>) => {
    if (selectedUnit) {
      updateMutation.mutate({ ...values, _id: selectedUnit._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (Unit?: UnitType) => {
    if (Unit) {
      setSelectedUnit(Unit);
    } else {
      setSelectedUnit(null);
    }
    setOpen(true);
  };

  const columns: TableProps<UnitType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn vị tính</Typography>,
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

  const rowSelection: TableRowSelection<UnitType> = {
    selectedRowKeys: selectedUnits,
    onChange: (newSelectedUnits: React.Key[]) => {
      setSelectedUnits(newSelectedUnits);
    },
  };
  const handleClearSearch = () => {
    setSearchValue("");
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
        <Typography>Đơn vị tính</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Đơn vị tính
            </Typography>
            <PageAction
              selectedIds={selectedUnits}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              isLoading={isLoading}
              totalItems={units.totalDocs}
              handleClearSearch={handleClearSearch}
            />
          </Box>
          <CustomTable<UnitType>
            data={units.data}
            total={units.totalDocs}
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
      <UnitModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedUnit={selectedUnit}
      />
    </Box>
  );
}
