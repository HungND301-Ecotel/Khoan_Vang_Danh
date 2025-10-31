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
import custom_theme from '../../theme';

export default function MaterialBudget() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<MaterialBudgetInputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});

  const queryClient = useQueryClient();

  const { data: materialbudgets = [] } = useQuery({
    queryKey: ["materialbudgets", searchValue],
    queryFn: async () =>
      api.get(`/materialbudgets?q=${searchValue}`).then((res) => res.data.data),
  });

  const filteredData = materialbudgets.filter((item: any) =>
    item.code?.toLowerCase().includes(searchValue.toLowerCase())
  );

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
      setExpandedData((prev) => ({ ...prev, [id]: data }));
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

    // Tạo dữ liệu mới với cấu trúc phẳng để hiển thị từng material riêng biệt
    const flattenedData: any[] = [];

    data?.assignments?.forEach((assignment: any) => {
      if (assignment.isHeader) {
        return;
      }

      if (assignment.materials && assignment.materials.length > 0) {
        assignment.materials.forEach(
          (material: Materials, materialIndex: number) => {
            flattenedData.push({
              ...assignment,
              material: material,
              isAssignmentHeader: materialIndex === 0,
              materialIndex: materialIndex,
            });
          }
        );
      } else {
        flattenedData.push({
          ...assignment,
          material: null,
          isAssignmentHeader: true,
        });
      }
    });

    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
        dataIndex: "material",
        key: "materialCode",
        width: 120,
        render: (material: Materials) => {
          return material ? material.code : "";
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>
        ),
        dataIndex: "code",
        key: "assignmentCode",
        width: 120,
        render: (text: string, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography sx={{ color: "black", fontWeight: "bold" }}>
              {row.code}
            </Typography>
          ) : null;
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Tên vật tư, tài sản
          </Typography>
        ),
        dataIndex: "name",
        key: "name",
        width: 250,
        render: (text: string, row: any) => {
          if (row.isAssignmentHeader) {
            return (
              <div>
                <Typography
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    marginBottom: row.material ? 1 : 0,
                  }}
                >
                  {row.name}
                </Typography>
                {row.material && (
                  <Typography sx={{ color: "black" }}>
                    {row.material.name}
                  </Typography>
                )}
              </div>
            );
          } else {
            return row.material ? (
              <Typography sx={{ color: "black" }}>
                {row.material.name}
              </Typography>
            ) : null;
          }
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
        dataIndex: "uom",
        key: "uom",
        width: 80,
        align: "center" as const,
        render: (text: string, row: any) => {
          if (row.isAssignmentHeader) {
            return (
              <div>
                <Typography
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    marginBottom: row.material ? 1 : 0,
                  }}
                >
                  {row.uom}
                </Typography>
                {row.material && (
                  <Typography sx={{ color: "black" }}>
                    {row.material.uom?.name}
                  </Typography>
                )}
              </div>
            );
          } else {
            return row.material ? (
              <Typography sx={{ color: "black" }}>
                {row.material.uom?.name}
              </Typography>
            ) : null;
          }
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Định mức gốc</Typography>
        ),
        dataIndex: "assignmentNorm",
        key: "assignmentNorm",
        width: 120,
        align: "center" as const,
        render: (value: number, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography
              sx={{ color: "black", marginBottom: row.material ? 1 : 0 }}
            >
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Hệ số điều chỉnh định mức
          </Typography>
        ),
        dataIndex: "adjustmentNorm",
        key: "adjustmentNorm",
        width: 150,
        align: "center" as const,
        render: (value: number, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography sx={{ marginBottom: row.material ? 1 : 0 }}>
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "totalNorm",
        key: "totalNorm",
        width: 100,
        align: "center" as const,
        render: (value: number, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography sx={{ marginBottom: row.material ? 1 : 0 }}>
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
        dataIndex: "quantity",
        key: "quantity",
        width: 100,
        align: "center" as const,
        render: (value: number, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography sx={{ marginBottom: row.material ? 1 : 0 }}>
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Đơn giá bình quân năm
          </Typography>
        ),
        dataIndex: "price",
        key: "price",
        width: 150,
        align: "center" as const,
        render: (value: number, row: any) => {
          // Chỉ hiển thị giá của assignment, không hiển thị giá vật tư
          return row.isAssignmentHeader ? (
            <Typography sx={{ color: "black", fontWeight: "bold" }}>
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Chi phí kế hoạch</Typography>
        ),
        dataIndex: "cost",
        key: "cost",
        width: 120,
        align: "center" as const,
        render: (value: number, row: any) => {
          return row.isAssignmentHeader ? (
            <Typography sx={{ marginBottom: row.material ? 1 : 0 }}>
              {value ? value.toLocaleString() : ""}
            </Typography>
          ) : null;
        },
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Ghi chú</Typography>,
        dataIndex: "note",
        key: "note",
        width: 100,
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
            Sản lượng:{" "}
            {data?.materialbudget?.production
              ? data?.materialbudget?.production.toLocaleString()
              : 0}{" "}
            (
            {data?.phaseGroup?.name?.toLowerCase() === "khấu than".toLowerCase()
              ? "tấn"
              : "mét"}
            )
          </Typography>
        </Box>

        <Table
          columns={innerColumns}
          dataSource={flattenedData}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
          rowKey={(item) =>
            `${record._id}-${item._id || item.code}-${item.materialIndex || 0}`
          }
          bordered
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

  const rowSelection: TableRowSelection<MaterialBudgetInputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Chi phí vật tư kế hoạch </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main }}>
              Chi phí vật tư kế hoạch
            </Typography>
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
                  onClick={() => handleDelete()}
                  disabled={selectedRows.length === 0}
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
                  Xóa ({selectedRows.length})
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
                  sx={{ backgroundColor: (theme) => custom_theme.palette.table_filter_box.main }}
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
            dataSource={filteredData}
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
