import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Container,
  Box,
  MenuItem,
  Grid,
  Button,
  Typography,
  IconButton,
  Breadcrumbs,
  InputAdornment,
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
import AdjustmentNormKCTModal from "../../components/AdjustmentNormKKTModal/AdjustmentNormKKTModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table as AntTable, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from '../../theme';

export default function AdjustmentNormKKT() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: adjustmentnorms = [], isLoading } = useQuery({
    queryKey: ["adjustmentnorms", searchValue],
    queryFn: async () => {
      try {
        const response = await api.get(`/adjustmentnorms?q=${searchValue}`);
        return response.data.data || [];
      } catch (error) {
        showErrorAlert("Không thể tải dữ liệu");
        return [];
      }
    },
  });

  const filteredData = adjustmentnorms.filter(
    (i: AdjustmentNormOutputType) => i.type === "CKKT"
  );

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
          updateAdjustmentNorm
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/adjustmentnorms/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustmentnorms"] });
      showSuccessAlert("Xóa thành công");
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
        selectedItems.forEach((id) => {
          if (typeof id === "string") {
            deleteMutation.mutate(id);
          }
        });
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

  const columns: TableProps<AdjustmentNormOutputType>["columns"] = [
    {
      title: "STT",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã định mức giao khoán
        </Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
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
          <Visibility  />
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
              {" "}
              {/* ép chiều cao */}
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
                  {item.norm ? item.norm.toLocaleString() : ""}
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
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Hệ số điều chỉnh định mức CK.KT</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>Hệ số điều chỉnh định mức CK.KT</Typography> */}
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
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
                  onClick={handleDelete}
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
                  disabled={
                    selectedItems.length === 0 || deleteMutation.isPending
                  }
                >
                  {deleteMutation.isPending
                    ? "Đang xóa..."
                    : `Xóa (${selectedItems.length})`}
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
                    "&:hover": { backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
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
          <AntTable<AdjustmentNormOutputType>
            rowKey="_id"
            rowSelection={rowSelection}
            loading={isLoading}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => {
                setExpandedRow(expanded ? record._id || null : null);
              },
              expandedRowRender,
            }}
            pagination={{
              position: ["bottomCenter"],
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              defaultPageSize: 10,
              showTotal: (total, range) => (
                <div style={{ flex: 1, textAlign: "left" }}>
                  Hiển thị {range[0]}-{range[1]} trên {total} mục
                </div>
              ),
            }}
            columns={columns}
            dataSource={filteredData}
          />
        </Box>
      </Box>
      <AdjustmentNormKCTModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}