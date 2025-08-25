import React, { useState } from "react";
import {
  TableContainer,
  TextField,
  Paper,
  Box,
  Button,
  Typography,
  IconButton,
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
} from "@mui/icons-material";
import CoalCuttingNormKBModal from "../../components/CoalCuttingNormKBModal/CoalCuttingNormKBModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

export default function CoalCuttingNormKB() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const queryClient = useQueryClient();

  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ["assignmentnorms"],
    queryFn: async () =>
      api.get("/assignmentnorms").then((res) => res.data.data),
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

    return (
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: "#f5f5f5", p: 1 }}
      >
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
                Độ dốc: {slopeLabel} / Chiều dày: {thicknessLabel}
              </th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
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
                onClick={() => handleDelete()}
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
              <TextField fullWidth size="small" placeholder="Tìm kiếm" />
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
            showTotal: (total: number, range: [number, number]) => (
              <div style={{ flex: 1, textAlign: "left" }}>
                Hiển thị {range[0]}-{range[1]} trên {total} mục
              </div>
            ),
          }}
          columns={columns}
          dataSource={assignmentnorms.filter((i: any) => i.type === "coal_kb")}
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
        />
      </Box>
    </Box>
  );
}
