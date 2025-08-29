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
import { MaterialBudgetInputType, Materials } from "../../types";
import MaterialBudgetModal from "../../components/MaterialBudgetModal/MaterialBudgetModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";

export default function MaterialBudget() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<MaterialBudgetInputType | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});

  const queryClient = useQueryClient();

  const { data: materialbudgets = [] } = useQuery({
    queryKey: ["materialbudgets", searchValue],
    queryFn: async () =>
      api
        .get(`/materialbudgets?q=${searchValue}`)
        .then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialBudget: Partial<MaterialBudgetInputType>) =>
      api.post("/materialbudgets", newMaterialBudget).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialbudgets"] });
      setOpen(false);
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateMaterialBudget: Partial<MaterialBudgetInputType>) =>
      api
        .put(
          `/materialbudgets/${updateMaterialBudget._id}`,
          updateMaterialBudget
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialbudgets"] });
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
      showErrorAlert('Vui lòng chọn ít nhất một bản ghi để xóa');
      return;
    }
    
    showConfirmAlert('Bạn có muốn xóa các bản ghi đã chọn?').then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(selectedRows);
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      const deletePromises = ids.map((id) =>
        api.delete(`/materialbudgets/${id}`).then((res) => res.data)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialbudgets"] });
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

  const getOneMutation = useMutation({
    mutationFn: (id: string) =>
      api.get(`/materialbudgets/getOne/${id}`).then((res) => res.data.data),
    onSuccess: (data, id) => {
      setExpandedData(prev => ({ ...prev, [id]: data }));
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<MaterialBudgetInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (materialBudget?: MaterialBudgetInputType) => {
    if (materialBudget) {
      setSelected(materialBudget);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

const handleView = (record: MaterialBudgetInputType) => {
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

  const expandedRowRender = (record: MaterialBudgetInputType) => {
    const data = expandedData[record._id || ""];
    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
        dataIndex: "code",
        key: "materialCode",
        render: (text: string, assignment: any, index: number) => {
          if (assignment.isHeader) {
            return null;
          }
          return assignment.materials?.map((material: Materials, materialIndex: number) => (
            <div key={materialIndex} style={{ padding: "4px 0" }}>
              {material.code}
            </div>
          ));
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
        dataIndex: "code",
        key: "assignmentCode",
        render: (text: string, assignment: any) => (
          <Typography sx={{ color: "black", fontWeight: "bold" }}>
            {assignment.code}
          </Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Tên vật tư, tài sản</Typography>,
        dataIndex: "name",
        key: "name",
        render: (text: string, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ color: "black", marginBottom: 1 }}>
                {assignment.name}
              </Typography>
              {assignment.materials?.map((material: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                  {material.name}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
        dataIndex: "uom",
        key: "uom",
        render: (text: string, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ color: "black", marginBottom: 1 }}>
                {assignment.uom}
              </Typography>
              {assignment.materials?.map((material: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                  {material.uom?.name}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức gốc</Typography>,
        dataIndex: "assignmentNorm",
        key: "assignmentNorm",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ color: "bue", marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((_: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Hệ số điều chỉnh định mức</Typography>,
        dataIndex: "adjustmentNorm",
        key: "adjustmentNorm",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((_: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "totalNorm",
        key: "totalNorm",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((_: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
        dataIndex: "quantity",
        key: "quantity",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((_: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>

                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Đơn giá bình quân năm</Typography>,
        dataIndex: "price",
        key: "price",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ color: "black", marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((material: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                  {material.currentPrice ? material.currentPrice.toLocaleString() : ""}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Chi phí kế hoạch</Typography>,
        dataIndex: "cost",
        key: "cost",
        align: "center" as const,
        render: (value: number, assignment: any) => {
          if (assignment.isHeader) {
            return null;
          }
          return (
            <div>
              <Typography sx={{ marginBottom: 1 }}>
                {value ? value.toLocaleString() : ""}
              </Typography>
              {assignment.materials?.map((_: Materials, index: number) => (
                <div key={index} style={{ padding: "4px 0" }}>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Ghi chú</Typography>,
        dataIndex: "note",
        key: "note",
        render: () => "",
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 1 }}>
            Công đoạn: {data?.materialbudget?.phase?.name}
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 1 }}>
            Mã định mức giao khoán: {data?.materialbudget?.code}
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 1 }}>
            Mã hệ số định mức: {data?.materialbudget?.adjustmentNormCode?.code}
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: 16, mb: 2 }}>
            Sản lượng: {data?.materialbudget?.production ? data?.materialbudget?.production.toLocaleString() : 0} ({data?.phaseGroup?.name?.toLowerCase() === "khấu than".toLowerCase() ? 'tấn' : 'mét'})
          </Typography>
        </Box>

        <Table
          columns={innerColumns}
          dataSource={data?.assignments || []}
          pagination={false}
          size="small"
          rowKey={(item) => `${record._id}-${item._id || item.code || Math.random()}`}
        />
      </Box>
    );
  };

  const columns: TableProps<MaterialBudgetInputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Mã định mức giao khoán</Typography>
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
              backgroundColor: "rgba(25, 118, 210, 0.04)"
            }
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
              backgroundColor: "rgba(25, 118, 210, 0.04)"
            }
          }}
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

  const rowSelection: TableRowSelection<MaterialBudgetInputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Chi phí vật tư kế hoạch (Zth)</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "black" }}>
              Chi phí vật tư kế hoạch (Zth)
            </Typography>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
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
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Print />}
                >
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
          <Table<MaterialBudgetInputType>
            rowKey={(record) => record._id || Math.random().toString()}
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
            dataSource={materialbudgets}
          />
        </Box>
      </Box>
      <MaterialBudgetModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}