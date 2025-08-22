import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  InputAdornment,
  TextField,
  IconButton,
  TableContainer,
  Paper,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  RemoveRedEyeOutlined,
  FilterList,
  Print,
  Search,
  FileUpload,
  FileDownload,
  Mail,
  ArrowDropDown,
} from "@mui/icons-material";
import { Table, TableProps } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { AssignmentNormInputType, AssignmentNormOutputType } from "../../types";
import CoalCuttingNormZHModal from "../../components/CoalCuttingNormZHModal/CoalCuttingNormZHModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";

export default function CoalCuttingNormZH() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ["assignmentnorms", searchValue],
    queryFn: async () =>
      api.get(`/assignmentnorms?q=${searchValue}`).then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newCuttingNorm: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", newCuttingNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.message || "Lỗi");
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
      showErrorAlert(error.response?.data?.message || error.message || "Lỗi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assignmentnorms/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.message || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (item?: AssignmentNormOutputType) => {
    setSelected(item ?? null);
    setOpen(true);
  };

  const handleToggleExpand = (record: AssignmentNormOutputType) => {
    const id = record?._id;
    if (!id) return;
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleDelete = (id?: string) => {
    if (!id) return showErrorAlert("Không tìm thấy bản ghi");
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((res) => {
      if (res.isConfirmed) deleteMutation.mutate(id);
    });
  };

  // Columns: index, code (bold), view, edit
  const columns: TableProps<AssignmentNormOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_v, _r, idx) => <Typography>{idx + 1}</Typography>,
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
          <RemoveRedEyeOutlined />
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
    const lengthLabel = record.length?.name || "";

    return (
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: "#f5f5f5", p: 1 }}
      >
        <TableContainer component={Paper} elevation={0}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>STT</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>
                  Mã giao khoán
                </th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>
                  Thành phần hao phí
                </th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Đơn vị</th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    fontWeight: 600,
                  }}
                >
                  {thicknessLabel} / {lengthLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {norms.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    {item.assignmentCode?.code}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    {item.assignmentCode?.name}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    {item.assignmentCode?.uom?.name}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    {item.norm ? item.norm.toLocaleString() : ""}
                  </td>
                </tr>
              ))}
              {norms.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      border: "1px solid #ccc",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableContainer>
      </TableContainer>
    );
  };

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
                color="warning"
                endIcon={<Add />}
                onClick={() => handleOpen()}
              >
                Tạo mới
              </Button>
              <Button
                variant="contained"
                color="error"
                endIcon={<Delete />}
                onClick={() => {
                  if (selectedRowKeys.length === 0) {
                    showErrorAlert("Chưa chọn bản ghi để xóa");
                    return;
                  }
                  showConfirmAlert(
                    `Bạn có muốn xóa ${selectedRowKeys.length} bản ghi?`
                  ).then((res) => {
                    if (res.isConfirmed) {
                      // nếu backend hỗ trợ xóa nhiều, gọi API tương ứng
                      api
                        .delete("/assignmentnorms", {
                          data: { ids: selectedRowKeys },
                        })
                        .then(() => {
                          queryClient.invalidateQueries({
                            queryKey: ["assignmentnorms"],
                          });
                          setSelectedRowKeys([]);
                          showSuccessAlert("Xóa thành công");
                        })
                        .catch((err) => {
                          showErrorAlert(
                            err.response?.data?.message || err.message || "Lỗi"
                          );
                        });
                    }
                  });
                }}
              >
                Xóa
              </Button>
            </Box>

            <Box display={"flex"} flex={1} gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FilterList />}
              >
                Lọc
              </Button>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
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
              >
                Tải lên
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileDownload />}
              >
                Xuất file
              </Button>
              <Button variant="outlined" color="inherit" startIcon={<Print />}>
                In
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Mail />}
                endIcon={<ArrowDropDown />}
              >
                Gửi
              </Button>
            </Box>
          </Box>
        </Box>

        <Table<AssignmentNormOutputType>
          rowKey="_id"
          rowSelection={rowSelection}
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
          dataSource={assignmentnorms.filter((i: any) => i.type === "coal_zh")}
          expandable={{
            expandedRowKeys: expandedRow ? [expandedRow] : [],
            onExpand: (expanded, record) => {
              setExpandedRow(expanded ? record._id ?? null : null);
            },
            expandedRowRender,
            expandIconColumnIndex: -1,
          }}
        />

        <CoalCuttingNormZHModal
          open={open}
          setOpen={setOpen}
          handleSubmit={handleSubmit}
          selected={selected}
        />
      </Box>
    </Box>
  );
}
