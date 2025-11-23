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
import CoalCuttingNormKBModal from "../../components/CoalCuttingNormKBModal/CoalCuttingNormKBModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from '../../theme';
import CustomTable from "../../components/CustomTable/CustomTable";

export default function CoalCuttingNormKB() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const queryClient = useQueryClient();

  const { data: assignmentnorms = { totalDocs: 0, data: [] }, isLoading } = useQuery({
    queryKey: ["assignmentnorms", searchValue, page, limit],
    queryFn: async () =>
      api.get(`/assignmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=coal_kb`).then((res) => res.data.data),
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
      `Bạn có muốn xóa ${selectedRowKeys.length} bản ghi? hành động này không thể hoàn tác.`
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
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
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

  const columns: TableProps<AssignmentNormOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_v, _r, idx) => <Typography>{(page - 1) * limit + idx + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã định mức giao khoán
        </Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_v, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
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
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>
        ),
        dataIndex: ["assignmentCode", "code"],
        key: "assignmentCode",
        align: "center" as const,
        width: "20%",
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
        render: (text: string) => (
          <Typography sx={{ color: "black" }}>{text}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Đơn vị</Typography>,
        dataIndex: ["assignmentCode", "uom", "name"],
        key: "uom",
        align: "center" as const,
        width: "10%",
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "norm",
        key: "norm",
        align: "center" as const,
        width: "10%",
        render: (value: number) => (value ? value.toLocaleString() : ""),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        {/* Header */}
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, backgroundColor: 'white' }}>
          <Grid container>
            <Grid item xs={3}>Độ dày vỉa (m)</Grid>
            <Grid item xs={9}>{thicknessLabel}</Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>Độ dốc vỉa</Grid>
            <Grid item xs={9}>{slopeLabel}</Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3}>Độ cứng</Grid>
            <Grid item xs={9}>{hardnessLabel}</Grid>
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
    setSearchValue('')
  }

  return (
    <Box>
      <Box mt={3}>
        <Box sx={{ mb: 2 }}>
          <Box
            display={"flex"}
            gap={4}
            mt={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display={"flex"} gap={2}>
              <Button
                variant="contained"
                endIcon={<Add />}
                onClick={() => handleOpen()}
                sx={{
                  backgroundColor: (theme) => custom_theme.palette.table_add_button.main,
                  "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_add_button.dark },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Tạo mới
              </Button>
              <Button
                variant="contained"
                endIcon={<Delete />}
                onClick={() => handleDelete()}
                disabled={selectedRowKeys.length === 0}
                sx={{
                  backgroundColor: (theme) => custom_theme.palette.table_delete_button.main,
                  "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_delete_button.dark },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Xóa ({selectedRowKeys.length})
              </Button>
            </Box>

            <Box display={"flex"} flex={1} gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FilterList />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Lọc
              </Button>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                sx={{ backgroundColor: (theme) => custom_theme.palette.table_filter_box.main }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box display={"flex"} gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileUpload />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Tải lên
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileDownload />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Xuất file
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Print />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                In
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Mail />}
                endIcon={<ArrowDropDown />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Gửi
              </Button>
            </Box>
          </Box>
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
              setExpandedRow(expanded ? record._id ?? null : null);
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
        />
      </Box>
    </Box>
  );
}