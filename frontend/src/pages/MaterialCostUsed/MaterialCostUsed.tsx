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
  MaterialCostUsedInputType,
  MaterialCostUsedOutputType,
} from "../../types";
import MaterialCostUsedModal from "../../components/MaterialCostUsedModal/MaterialCostUsedModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

export default function MaterialCostUsed() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<MaterialCostUsedOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});

  const queryClient = useQueryClient();

  const { data: materialcostuseds = [] } = useQuery({
    queryKey: ["materialcostuseds", searchValue],
    queryFn: async () => {
      const query = searchValue ? `?q=${searchValue}` : "";
      try {
        const res = await api.get(`/materialcostuseds${query}`);
        return res.data?.data || [];
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Lỗi khi tải dữ liệu";
        showErrorAlert(errorMessage);
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialCostUsed: Partial<MaterialCostUsedInputType>) =>
      api
        .post("/materialcostuseds", newMaterialCostUsed)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Lỗi khi thêm mới";
      console.log(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMaterialCostUsed: Partial<MaterialCostUsedInputType>) =>
      api
        .put(
          `/materialcostuseds/${updateMaterialCostUsed._id}`,
          updateMaterialCostUsed
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      setOpen(false);
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật";
      console.log(errorMessage);
      showErrorAlert(errorMessage);
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
        api.delete(`/materialcostuseds/${id}`).then((res) => res.data)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi xóa";
      console.error(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const getOneMutation = useMutation({
    mutationFn: (id: string) =>
      api.get(`/materialcostuseds/${id}`).then((res) => res.data.data),
    onSuccess: (data, id) => {
      setExpandedData((prev) => ({ ...prev,
         [id]: { ...data, plannedCostCode: data.plannedCostCode  },
        }));
    },
    onError: (error: any, variables) => {
      const errorMessage =
        error.response?.data?.message || "Không tìm thấy dữ liệu";
      console.log(errorMessage);
      setExpandedData((prev) => ({ ...prev, [variables]: null }));
      if (error.response?.status !== 404) {
        showErrorAlert(errorMessage);
      }
    },
  });

  const handleSubmit = (values: Partial<MaterialCostUsedInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (materialCostUsed?: MaterialCostUsedOutputType) => {
    if (materialCostUsed) {
      setSelected(materialCostUsed);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  const handleView = (record: MaterialCostUsedOutputType) => {
    const key = record._id;
    if (!key) {
      showErrorAlert("Không tìm thấy ID của bản ghi");
      return;
    }

    if (expandedRowKeys.includes(key)) {
      setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
    } else {
      setExpandedRowKeys([...expandedRowKeys, key]);
      if (!expandedData[key] && expandedData[key] !== null) {
        getOneMutation.mutate(key);
      }
    }
  };

  const expandedRowRender = (record: MaterialCostUsedOutputType) => {
    const key = record._id || "";
    const data = expandedData[key] || record;

    // Hiển thị thông báo lỗi nếu không tìm thấy dữ liệu chi tiết
    if (data === null) {
      return (
        <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography color="error">
            Không thể tải thông tin chi tiết. Có thể bản ghi đã bị xóa.
          </Typography>
        </Box>
      );
    }

    // Hiển thị loading khi đang tải dữ liệu
    if (!data.materials) {
      return <Box sx={{ p: 2 }}>Đang tải...</Box>;
    }

    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}>STT</Typography>,
        dataIndex: "index",
        key: "index",
        width: 60,
        align: "center" as const,
        render: (text: string, item: any, index: number) => (
          <Typography>{index + 1}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
        dataIndex: "code",
        key: "code",
        render: (text: string, item: any) => (
          <Typography>{item.material?.code}</Typography>
        ),
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Tên vật tư, tài sản
          </Typography>
        ),
        dataIndex: "name",
        key: "name",
        render: (text: string, item: any) => (
          <Typography>{item.material?.name}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
        dataIndex: "uom",
        key: "uom",
        render: (text: string, item: any) => (
          <Typography>{item.material?.uom?.name}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
        dataIndex: "quantity",
        key: "quantity",
        align: "center" as const,
        render: (value: number) => (
          <Typography>{value ? value.toLocaleString() : ""}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>,
        dataIndex: "price",
        key: "price",
        align: "center" as const,
        render: (text: string, item: any) => (
          <Typography>
            {item.material?.currentPrice
              ? item.material?.currentPrice.toLocaleString()
              : ""}
          </Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Chi phí</Typography>,
        dataIndex: "cost",
        key: "cost",
        align: "center" as const,
        render: (value: number) => (
          <Typography>{value ? value.toLocaleString() : ""}</Typography>
        ),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 1 }}>
            Mã chi phí thực hiện: {data.code}
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 1 }}>
            Mã chi phí vật tư kế hoạch: {data.plannedCostCode}
          </Typography>
        </Box>
        <Table
          columns={innerColumns}
          dataSource={data.materials || []}
          pagination={false}
          size="small"
          rowKey={(item) => item._id}
        />
      </Box>
    );
  };

  const columns: TableProps<MaterialCostUsedOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã chi phí thực hiện{" "}
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

  const rowSelection: TableRowSelection<MaterialCostUsedOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Chi phí vật tư thực hiện </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Chi phí vật tư thực hiện
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
          <Table<MaterialCostUsedOutputType>
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
            dataSource={materialcostuseds}
          />
        </Box>
      </Box>
      <MaterialCostUsedModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}