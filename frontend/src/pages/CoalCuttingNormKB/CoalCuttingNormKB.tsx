import React, { useState } from "react";
import {
  TableContainer,
  TextField,
  Paper,
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Grid,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { AssignmentNormOutputType, AssignmentNormInputType } from "../../types";
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
  Visibility,
  Search,
} from "@mui/icons-material";
import CoalCuttingNormKBModal from "./CoalCuttingNormKBModal/CoalCuttingNormKBModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import ImportErrorDialog from "../../components/ImportErrorDialog/ImportErrorDialog";
import { formatDecimal } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

export default function CoalCuttingNormKB() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    messages: [] as string[],
  });

  const queryClient = useQueryClient();

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<AssignmentNormInputType>
  >(setOpen, "Định mức khấu than KB");

  const { data: assignmentnorms = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["assignmentnorms", searchValue, page, limit],
      queryFn: async () =>
        api
          .get(
            `/assignmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=coal_kb`,
          )
          .then((res) => res.data.data),
    });

  const handleToggleExpand = (cuttingnorm: AssignmentNormOutputType) => {
    const id = cuttingnorm?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const createMutation = useMutation({
    mutationFn: (newCuttingNorm: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", newCuttingNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateCuttingNorm: Partial<AssignmentNormInputType>) =>
      api
        .put(`/assignmentnorms/${updateCuttingNorm._id}`, updateCuttingNorm)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setOpen(false);
      clearMinimize();
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      showErrorAlert("Không tìm thấy bản ghi");
      return;
    }
    showConfirmAlert(
      `Bạn có muốn xóa ${selectedRowKeys.length} bản ghi? hành động này không thể hoàn tác.`,
    ).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedRowKeys);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: React.Key[]) =>
      api
        .delete(`/assignmentnorms`, { data: { ids } })
        .then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setSelectedRowKeys([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    const targetId = selected?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...values, _id: targetId });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (CuttingNorm?: AssignmentNormOutputType) => {
    if (CuttingNorm) {
      setSelected(CuttingNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  // Mutation xử lý Import
  const importMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api
        .post("/assignmentnorms/importFile?type=coal_kb", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });

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
      showErrorAlert(error.response?.data?.message || "Lỗi khi import file");
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      api.post(
        "/assignmentnorms/exportFile?type=coal_kb",
        {},
        { responseType: "blob" },
      ),
    onSuccess: (res: any) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dinh_muc_khau_than_kb.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessAlert("Xuất file thành công");
    },
    onError: (error: any) => {
      showErrorAlert("Không thể xuất file");
    },
  });

  const columns: TableProps<AssignmentNormOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_v, _r, idx) => (
        <Typography>{(page - 1) * limit + idx + 1}</Typography>
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
      render: (_v, record) => <Typography>{record.code}</Typography>,
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      key: "view",
      width: 70,
      align: "center",
      render: (_v, record) => (
        <IconButton
          size="small"
          onClick={() => handleToggleExpand(record)}
          aria-label="xem"
        >
          <Visibility />
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      key: "edit",
      width: 70,
      align: "center",
      render: (_v, record) => (
        <Box display="flex" gap={1} justifyContent="center">
          <IconButton
            size="small"
            onClick={() => handleOpen(record)}
            aria-label="sua"
          >
            <Edit />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<AssignmentNormOutputType> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const expandedRowRender = (record: AssignmentNormOutputType) => {
    const norms = record.norms || [];
    const thicknessLabel = record.thickness?.name || "";
    const slopeLabel = record.curbSlope?.name || "";
    const hardnessLabel = record.hardness?.name || "";

    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}></Typography>,
        key: "index",
        align: "center" as const,
        width: "5%",
        render: (_: any, __: any, index: number) => (
          <Typography>{index + 1}</Typography>
        ),
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>
        ),
        dataIndex: ["assignmentCode", "code"],
        key: "assignmentCode",
        align: "center" as const,
        width: "20%",
        render: (text: string) => <Typography>{text}</Typography>,
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Thành phần hao phí
          </Typography>
        ),
        dataIndex: ["assignmentCode", "name"],
        key: "name",
        width: "55%",
        render: (text: string) => <Typography>{text}</Typography>,
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Đơn vị</Typography>,
        dataIndex: ["assignmentCode", "uom", "name"],
        key: "uom",
        align: "center" as const,
        width: "10%",
        render: (text: string) => <Typography>{text}</Typography>,
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "norm",
        key: "norm",
        align: "center" as const,
        width: "10%",
        render: (value: number) => (
          <Typography>{formatDecimal(value)}</Typography>
        ),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            backgroundColor: "white",
          }}
        >
          <Grid container>
            <Grid item xs={3}>
              <Typography>Độ dày vỉa (m)</Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography>{thicknessLabel}</Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>
              <Typography>Độ dốc vỉa</Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography>{slopeLabel}</Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>
              <Typography>Độ cứng</Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography>{hardnessLabel}</Typography>
            </Grid>
          </Grid>
        </Box>
        {/* Bảng con */}
        <Table
          columns={innerColumns}
          dataSource={norms}
          pagination={false}
          size="small"
          rowKey={(item, idx) => `${record._id}-${idx}`}
          locale={{ emptyText: "Không có dữ liệu" }}
        />
      </Box>
    );
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  return (
    <>
      <Box>
        <Box mt={3}>
          <Box sx={{ mb: 2 }}>
            <PageAction
              selectedIds={selectedRowKeys}
              handleDelete={handleDelete}
              deleteMutation={deleteMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              exportExcel={exportMutation}
              importFile={importMutation}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={assignmentnorms.totalDocs}
            />
          </Box>

          <CustomTable<AssignmentNormOutputType>
            data={assignmentnorms.data}
            total={assignmentnorms.totalDocs}
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
                setExpandedRow(expanded ? (record._id ?? null) : null);
              },
              expandedRowRender,
              expandIconColumnIndex: -1,
            }}
          />

          <CoalCuttingNormKBModal
            open={open}
            setOpen={setOpen}
            handleSubmit={handleSubmit}
            selected={selected}
            hasExistingRecords={assignmentnorms.totalDocs > 1}
            existingNorms={assignmentnorms.data}
            minimizedData={minimizedData}
            onMinimize={handleMinimize}
            clearMinimize={clearMinimize}
          />
        </Box>
      </Box>
      <ImportErrorDialog
        open={errorDialog.open}
        errors={errorDialog.messages}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
      />
    </>
  );
}
