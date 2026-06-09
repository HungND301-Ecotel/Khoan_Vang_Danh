import React, { useRef, useState } from "react";
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
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { AdjustmentNormInputType, AdjustmentNormOutputType } from "../../types";
import AdjustmentNormCMModal from "./AdjustmentNormCMModal/AdjustmentNormCMModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table as AntTable, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import AdjustmentNormService from "../../service/AdjustmentNormService";
import { parseAxiosError } from "../../utils/handleApiError";
import { AdjustmentNormType } from "../../enum";
import { ShowAlertImport } from "../../utils/AlertImport";
import { formatDecimal } from "../../utils/helpers";
import ImportErrorDialog from "../../components/ImportErrorDialog/ImportErrorDialog";
import PageAction from "../../components/Common/PageAction";

export default function AdjustmentNormCM() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    messages: [] as string[],
  });

  const queryClient = useQueryClient();

  // Fetch all data without search parameter to handle filtering locally
  const {
    data: adjustmentnorms = { totalDocs: 0, data: [] },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["adjustmentnorms", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/adjustmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=${AdjustmentNormType.CM}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AdjustmentNormInputType>) =>
      api.post("/adjustmentnorms", newExcavationNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<AdjustmentNormInputType>) =>
      api
        .put(
          `/adjustmentnorms/${updateExcavationNorm._id}`,
          updateExcavationNorm,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      AdjustmentNormService.importFile(formData, AdjustmentNormType.CM),
    onMutate: () => {
      // setIsUploading(true);
      // setProgress(0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      // setIsUploading(false);
      if (data.invalidRows?.length > 0) {
        const formattedErrors = data.invalidRows.map(
          (err: any) => `Dòng ${err.row || "?"}: ${err.error}`,
        );
        setErrorDialog({ open: true, messages: formattedErrors });
      } else {
        showSuccessAlert(
          `Import thành công! (Thêm: ${data.summary.inserted}, Sửa: ${data.summary.updated}, Xóa: ${data.summary.deleted})`,
        );
      }
    },
    onError: (error: any) => {
      // setIsUploading(false);
      showErrorAlert(error.response?.data?.message || "Lỗi khi import");
    },
  });

  const exportExcel = useMutation({
    mutationFn: () => AdjustmentNormService.exportFile(AdjustmentNormType.CM),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedRows as string[]);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.delete(`/adjustmentnorms`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      console.error(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const handleSubmit = (values: Partial<AdjustmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (excavationNorm?: AdjustmentNormOutputType) => {
    if (excavationNorm) {
      setSelected(excavationNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const expandedRowRender = (record: AdjustmentNormOutputType) => (
    <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
      <TableContainer>
        <Table
          sx={{
            "& td, & th": { border: 0 },
          }}
        >
          <TableBody>
            {/* Hàng thông tin chung */}
            <TableRow sx={{ height: 28 }}>
              <TableCell colSpan={3} sx={{ fontWeight: "bold", py: 0.5 }}>
                Tỷ lệ % gương than mềm (Cm)
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ py: 0.5 }}>
                {record.mirrorRatio?.name || "-"}
              </TableCell>
            </TableRow>
          </TableBody>

          {/* Phần bảng dữ liệu norms nền trắng */}
          <TableBody sx={{ backgroundColor: "#fff" }}>
            {record.norms?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell align="center" sx={{ width: "5%" }}>
                  {index + 1}
                </TableCell>
                <TableCell align="center" sx={{ width: "20%" }}>
                  {item.assignmentCode?.code}
                </TableCell>
                <TableCell sx={{ width: "55%" }}>
                  {item.assignmentCode?.name}
                </TableCell>
                <TableCell align="center" sx={{ width: "10%" }}>
                  {item.assignmentCode?.uom?.name || ""}
                </TableCell>
                <TableCell align="center" sx={{ width: "10%" }}>
                  {formatDecimal(item.norm)}
                </TableCell>
              </TableRow>
            ))}

            {(!record.norms || record.norms.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const columns: TableProps<AdjustmentNormOutputType>["columns"] = [
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
          Mã định mức giao khoán
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
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>
        </Box>
      ),
      dataIndex: "view",
      key: "view",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={() => {
              const key = record._id as React.Key;
              if (expandedRowKeys.includes(key)) {
                setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
              } else {
                setExpandedRowKeys([...expandedRowKeys, key]);
              }
            }}
            size="small"
          >
            <Visibility color="secondary" />
          </IconButton>
        </Box>
      ),
    },

    {
      title: (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>
        </Box>
      ),
      dataIndex: "edit",
      key: "edit",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Box display="flex" justifyContent="center">
          <IconButton onClick={() => handleOpen(record)} size="small">
            <Edit color="primary" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<AdjustmentNormOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedRows}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportExcel}
              importFile={importFile}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={adjustmentnorms.totalDocs}
            />
          </Box>

          <CustomTable<AdjustmentNormOutputType>
            data={adjustmentnorms.data}
            total={adjustmentnorms.totalDocs}
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
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) =>
                setExpandedRowKeys(keys as React.Key[]),
              expandedRowRender,
              showExpandColumn: false,
            }}
          />
        </Box>
      </Box>
      <AdjustmentNormCMModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
      <ImportErrorDialog
        open={errorDialog.open}
        errors={errorDialog.messages}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
      />
    </Box>
  );
}
