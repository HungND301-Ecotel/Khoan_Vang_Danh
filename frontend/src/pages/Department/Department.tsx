import {
  Edit,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import DepartmentModal from "./DepartmentModal/DepartmentModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DepartmentType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import DepartmentService from "../../service/DepartmentService";
import { parseAxiosError } from "../../utils/handleApiError";
import CustomTable from "../../components/CustomTable/CustomTable";
import { ShowAlertImport } from "../../utils/AlertImport";
import PageAction from "../../components/Common/PageAction";

export default function Department() {
  const [open, setOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const {
    data: departments = {
      totalDocs: 0,
      data: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["departments", searchValue, page, limit],
    queryFn: () =>
      api
        .get(`/departments?q=${searchValue}&page=${page}&limit=${limit}`)
        .then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newDepartment: Partial<DepartmentType>) =>
      api.post("/departments", newDepartment).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const [, setProgress] = useState(0);
  const [, setIsUploading] = useState(false);
  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      DepartmentService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsUploading(false);
      ShowAlertImport(data);
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: DepartmentService.exportFile,
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateDepartment: Partial<DepartmentType>) =>
      api.put(`/departments/${updateDepartment._id}`, updateDepartment).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      setSelectedDepartment(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
    if (selectedDepartments.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedDepartments.length} bản ghi? hành động này không thể hoàn tác.`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedDepartments);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api.delete(`/departments`, { data: { ids } }).then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setSelectedDepartments([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<DepartmentType>) => {
    if (selectedDepartment) {
      updateMutation.mutate({ ...values, _id: selectedDepartment._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (Department?: DepartmentType) => {
    if (Department) {
      setSelectedDepartment(Department);
    } else {
      setSelectedDepartment(null);
    }
    setOpen(true);
  };

  const columns: TableProps<DepartmentType>["columns"] = [
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
      title: <Typography sx={{ fontWeight: "bold" }}>Mã phân xưởng</Typography>,
      dataIndex: "code",
      key: "code",
      render: (_, record) => <Typography>{record.code}</Typography>,
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên phân xưởng</Typography>,
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

  const rowSelection: TableRowSelection<DepartmentType> = {
    selectedRowKeys: selectedDepartments,
    onChange: (newSelectedDepartments: React.Key[]) => {
      setSelectedDepartments(newSelectedDepartments);
    },
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  return (
    <Box
      sx={{
        px: 5,
        py: 1,
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Phân xưởng</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Phân xưởng
            </Typography>
            <PageAction
              selectedIds={selectedDepartments}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              isLoading={isLoading}
              totalItems={departments.totalDocs}
              handleClearSearch={handleClearSearch}
            />
          </Box>
          <CustomTable<DepartmentType>
            data={departments.data}
            total={departments.totalDocs}
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
      <DepartmentModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedDepartment={selectedDepartment}
      />
    </Box>
  );
}
