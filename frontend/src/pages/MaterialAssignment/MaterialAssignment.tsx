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
} from "@mui/material";
import { useState, useRef } from "react";
import MaterialAssignmentModal from "./MaterialAssignmentModal/MaterialAssignment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialAssignmentInputType, Materials } from "../../types";
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
import MaterialAssignmentService from "../../service/MaterialAssignmentService";
import { parseAxiosError } from "../../utils/handleApiError";
import ImportErrorDialog from "../../components/ImportErrorDialog/ImportErrorDialog";
import { ShowAlertImport } from "../../utils/AlertImport";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import { useSearchParams } from "react-router-dom";

import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function MaterialAssignment() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "in"; // "in" = trong khoán, "out" = ngoài khoán
  const isOutPlan = type === "out";
  const [open, setOpen] = useState(false);
  const [selectedMaterialAssignment, setSelectedMaterialAssignment] =
    useState<Materials | null>(null);
  const [selectedMaterialAssignments, setSelectedMaterialAssignments] =
    useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    messages: [] as string[],
  });

  const queryClient = useQueryClient();
  const modalTitle = isOutPlan
    ? "Vật tư tài sản khác"
    : "Vật tư tài sản trong khoán";
  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<MaterialAssignmentInputType>
  >(setOpen, modalTitle);

  const {
    data: materialAssignments = {
      totalDocs: 0,
      results: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["materialAssignments", searchValue, page, limit, type],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/materialAssignments?q=${searchValue}&page=${page}&limit=${limit}&type=${type}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
      api
        .post("/materialassignments", newMaterialAssignment)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (
      updateMaterialAssignment: Partial<MaterialAssignmentInputType>,
    ) =>
      api
        .put(
          `/materialassignments/${updateMaterialAssignment._id}`,
          updateMaterialAssignment,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setOpen(false);
      clearMinimize();
      setSelectedMaterialAssignment(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDelete = (id?: string) => {
    if (!id) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleDeleteMultiple = () => {
    if (selectedMaterialAssignments.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert(
      `Bạn có muốn xóa ${selectedMaterialAssignments.length} bản ghi đã chọn?`,
    ).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedMaterialAssignments.map((id) =>
          api.delete(`/materialassignments/${id}`),
        );

        Promise.all(deletePromises)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ["materialAssignments"],
            });
            setSelectedMaterialAssignments([]);
            showSuccessAlert(
              `Đã xóa ${selectedMaterialAssignments.length} bản ghi thành công`,
            );
          })
          .catch((error) => {
            console.error("Lỗi khi xóa:", error);
            showErrorAlert("Có lỗi xảy ra khi xóa các bản ghi");
          });
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/materialassignments/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MaterialAssignmentInputType>) => {
    const targetId = selectedMaterialAssignment?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (MaterialAssignment?: Materials) => {
    if (MaterialAssignment) {
      setSelectedMaterialAssignment(MaterialAssignment);
    } else {
      setSelectedMaterialAssignment(null);
    }
    setOpen(true);
  };

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      MaterialAssignmentService.importFile(formData, setProgress),
    onMutate: () => {
      setIsUploading(true);
      setProgress(0);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      setIsUploading(false);

      const data = res?.data || res;

      ShowAlertImport(data);

      // 3. Nếu có lỗi chi tiết, mở Dialog đỏ lên
      if (data?.invalidRows && data.invalidRows.length > 0) {
        const formattedErrors = data.invalidRows.map(
          (err: any) => `Dòng ${err.row || "?"}: ${err.error}`,
        );
        setErrorDialog({ open: true, messages: formattedErrors });
      }
    },
    onError: (error: any) => {
      setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: () => MaterialAssignmentService.exportFile(type),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const columns: TableProps<Materials>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    ...(!isOutPlan
      ? [
          {
            title: (
              <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>
            ),
            dataIndex: "assignmentCode",
            key: "assignmentCode",
            width: 200,
            render: (_: any, record: Materials) => (
              <Typography>{record.assignmentCode?.code}</Typography>
            ),
            sorter: (a: Materials, b: Materials) =>
              (a.assignmentCode?.code ?? "").localeCompare(
                b.assignmentCode?.code ?? "",
                "vi",
                { sensitivity: "base" },
              ),
          },
        ]
      : []),
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (_, record) => <Typography>{record.code}</Typography>,
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên vật tư</Typography>,
      dataIndex: "name",
      key: "name",
      render: (value, record) => <Typography>{value}</Typography>,
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
    },
    ...(!isOutPlan
      ? [
          {
            title: (
              <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>
            ),
            dataIndex: "quantity",
            key: "quantity",
            render: (_: any, record: Materials) => (
              <Typography>{formatDecimal(record?.quantity)}</Typography>
            ),
          },
        ]
      : []),
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <Typography>{formattedPrice(record?.currentPrice)}</Typography>
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

  const rowSelection: TableRowSelection<Materials> = {
    selectedRowKeys: selectedMaterialAssignments,
    onChange: (newSelectedMaterialAssignments: React.Key[]) => {
      setSelectedMaterialAssignments(newSelectedMaterialAssignments);
    },
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const breadcrumbSuffix = isOutPlan ? "khác" : "trong khoán";
  const titleSuffix = isOutPlan ? "khác" : "trong khoán";

  return (
    <>
      <Box
        sx={{
          px: 5, // horizontal = 32px
          py: 1, // vertical = 8px
        }}
      >
        <Breadcrumbs aria-label="breadcrumb">
          <Typography>Danh mục</Typography>
          <Typography>Vật tư tài sản</Typography>
          <Typography>Vật tư tài sản {breadcrumbSuffix}</Typography>
        </Breadcrumbs>
        <Box mt={3}>
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h4"
                sx={{ color: (theme) => custom_theme.palette.table_name.main }}
              >
                Vật tư tài sản {titleSuffix}
              </Typography>
              <PageAction
                selectedIds={selectedMaterialAssignments}
                handleDelete={handleDelete}
                deleteMutation={deleteMutation}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                exportExcel={exportExcel}
                importFile={importFile}
                handleOpen={handleOpen}
              />
            </Box>
            <CustomTable<Materials>
              data={materialAssignments.data}
              total={materialAssignments.totalDocs}
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
        <MaterialAssignmentModal
          open={open}
          setOpen={setOpen}
          handleSubmit={handleSubmit}
          selectedMaterialAssignment={selectedMaterialAssignment}
          minimizedData={minimizedData}
          onMinimize={handleMinimize}
          clearMinimize={clearMinimize}
          isOutPlan={isOutPlan}
        />
      </Box>
      <ImportErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        errors={errorDialog.messages}
      />
    </>
  );
}
