import React, { useState } from "react";
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
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  ProductionScopeInputType,
  ProductionScopeOutputType,
} from "../../types";
import ProductionScopeModal from "../../components/ProductionScopeModal/ProductionScopeModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

export default function ProductScope() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<ProductionScopeOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes", searchValue],
    queryFn: async () =>
      api
        .get(`/productionscopes?q=${searchValue}`)
        .then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<ProductionScopeInputType>) =>
      api.post("/productionscopes", newExcavationNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<ProductionScopeInputType>) =>
      api
        .put(
          `/productionscopes/${updateExcavationNorm._id}`,
          updateExcavationNorm
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
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
    if (selectedRows.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    showConfirmAlert("Bạn có muốn xóa các bản ghi đã chọn?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedRows);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      const deletePromises = ids.map((id) =>
        api.delete(`/productionscopes/${id}`).then((res) => res.data)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionscopes"] });
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

  const handleSubmit = (values: Partial<ProductionScopeInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const filteredData = productionscopes.filter(
  (item: ProductionScopeOutputType) =>
    item.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchValue.toLowerCase())
);

  const handleOpen = (excavationNorm?: ProductionScopeOutputType) => {
    if (excavationNorm) {
      setSelected(excavationNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  const handleView = (record: ProductionScopeOutputType) => {
    const key = record._id;
    if (key && expandedRowKeys.includes(key)) {
      setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
    } else if (key) {
      setExpandedRowKeys([...expandedRowKeys, key]);
    }
  };

  const expandedRowRender = (record: ProductionScopeOutputType) => {
    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Công đoạn</Typography>,
        dataIndex: "phase",
        key: "phase",
        render: (phase: any) => (
          <Typography sx={{ color: "blue" }}>{phase?.name}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Sản lượng</Typography>,
        dataIndex: "production",
        key: "production",
        render: (production: number) =>
          production ? production.toLocaleString() : "0",
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Table
          columns={innerColumns}
          dataSource={record.phases}
          pagination={false}
          size="small"
          rowKey={(item, index) => `${record._id}-${index}`}
        />
      </Box>
    );
  };

  const columns: TableProps<ProductionScopeOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Mã diện sản xuất</Typography>
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
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên diện sản xuất</Typography>
      ),
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.name}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      key: "view",
      width: 80,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() => handleView(record)}
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Visibility />
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "edit",
      key: "edit",
      width: 80,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() => handleOpen(record)}
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<ProductionScopeOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Điện sản xuất</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Điện sản xuất
            </Typography>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  color="warning"
                  endIcon={<Add />}
                  onClick={() => handleOpen()}
                  sx={{
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
                  color="error"
                  endIcon={<Delete />}
                  onClick={() => handleDelete()}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 3,
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
                  sx={{
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
          <Table<ProductionScopeOutputType>
            rowKey="_id"
            rowSelection={rowSelection}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) =>
                setExpandedRowKeys(keys as React.Key[]),
              expandedRowRender,
              showExpandColumn: false,
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
      <ProductionScopeModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}