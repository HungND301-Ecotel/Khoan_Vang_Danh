import React, { useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { AdjustmentNormInputType, AdjustmentNormOutputType } from "../../types";
import {
  Add,
  Delete,
  Edit,
  Visibility,
  ArrowDropDown,
  FileDownload,
  FileUpload,
  FilterList,
  Print,
  Mail,
  Search,
} from "@mui/icons-material";
import AdjustmentNormKCTModal from "./AdjustmentNormKKTModal/AdjustmentNormKKTModal";
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

export default function AdjustmentNormKKT() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<React.Key[]>([]);
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
    data: adjustmentnorms = {},
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["adjustmentnorms", searchValue, page, limit],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/adjustmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=${AdjustmentNormType.CKKT}`,
        );
        return response.data.data;
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
      }
    },
  });

  const handleToggleExpand = (adjustmentnorm: AdjustmentNormOutputType) => {
    const id = adjustmentnorm?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const createMutation = useMutation({
    mutationFn: (newAdjustmentNorm: Partial<AdjustmentNormInputType>) =>
      api.post("/adjustmentnorms", newAdjustmentNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Lỗi không xác định";
      console.error("Create error:", errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateAdjustmentNorm: Partial<AdjustmentNormInputType>) =>
      api
        .put(
          `/adjustmentnorms/${updateAdjustmentNorm._id}`,
          updateAdjustmentNorm,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      setOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Lỗi không xác định";
      console.error("Update error:", errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const importFile = useMutation({
    mutationFn: (formData: FormData) =>
      AdjustmentNormService.importFile(formData, AdjustmentNormType.CKKT),
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
    mutationFn: () => AdjustmentNormService.exportFile(AdjustmentNormType.CKKT),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.delete(`/adjustmentnorms`, { data: { ids } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      showSuccessAlert("Xóa thành công");
      setSelectedItems([]);
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
    if (selectedItems.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedItems as string[]);
      }
    });
  };

  const handleSubmit = (values: Partial<AdjustmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (adjustmentNorm?: AdjustmentNormOutputType) => {
    if (adjustmentNorm) {
      setSelected(adjustmentNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchValue("");
  };

  const columns: TableProps<AdjustmentNormOutputType>["columns"] = [
    {
      title: <Typography sx={{ fontWeight: "bold" }}>STT</Typography>,
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
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      width: 80,
      render: (_, record) => (
        <IconButton onClick={() => handleToggleExpand(record)}>
          <Visibility color="secondary" />
        </IconButton>
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

  const rowSelection: TableRowSelection<AdjustmentNormOutputType> = {
    selectedRowKeys: selectedItems,
    onChange: (newSelectedItems: React.Key[]) => {
      setSelectedItems(newSelectedItems);
    },
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
                Độ cứng của đá lẫn trong gương
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ py: 0.5 }}>
                {record.hardness?.name || "-"}
              </TableCell>
            </TableRow>

            <TableRow sx={{ height: 28 }}>
              <TableCell colSpan={3} sx={{ fontWeight: "bold", py: 0.5 }}>
                Tỉ lệ đá lẫn trong gương (Ckẹp)
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ py: 0.5 }}>
                {record.rockRatio?.name || "-"}
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

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedItems}
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
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => {
                setExpandedRow(expanded ? record._id || null : null);
              },
              expandedRowRender,
            }}
          />
        </Box>
      </Box>
      <AdjustmentNormKCTModal
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
