import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Paper,
  TableContainer,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import api from "../../config/api.config";
import {
  AssignmentCodeInputType,
  MaterialAssignmentInputType,
  MaterialAssignmentOutputType,
  Materials,
} from "../../types";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { Table, TableProps } from "antd";
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
import custom_theme from '../../theme';

interface FlatMaterial {
  _id: string;
  code: string;
  materialCode?: string;
  name: string;
  uom?: string;
  quantity?: number;
  price?: number;
  note: string;
}

export default function Materialunitprice() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<MaterialAssignmentOutputType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<MaterialAssignmentOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: materialAssignments = [] } = useQuery({
    queryKey: ["materialAssignments"],
    queryFn: () =>
      api.get("/materialassignments").then((res) => {
        setData(res.data.data);
        return res.data.data;
      }),
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
        .delete(`/materialassignments`, { data: { ids } })
        .then((res) => res.data.message),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["materialassignments"] });
      setSelectedRowKeys([]);
      showSuccessAlert(message || "Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || "Lỗi");
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (
      updateMaterialAssignment: Partial<MaterialAssignmentInputType>
    ) =>
      api
        .put(
          `/materialassignments/${updateMaterialAssignment._id}`,
          updateMaterialAssignment
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updatematerialMutation = useMutation({
    mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api
        .put(
          `/assignmentcodes/${updateAssignmentCode._id}`,
          updateAssignmentCode
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleToggleExpand = (cuttingnorm: MaterialAssignmentOutputType) => {
    const id = cuttingnorm?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleOpen = (record?: MaterialAssignmentOutputType) => {
    setSelected(record ?? null);
    setOpen(true);
  };

  const columns: TableProps<FlatMaterial>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_v, _r, idx) => <Typography>{idx + 1}</Typography>,
    },
    {
      title: (
        <Typography style={{ fontWeight: "bold" }}>Mã giao khoán</Typography>
      ),
      dataIndex: "code",
      key: "code",
      align: "center",
      width: 180,
      render: (_v, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography style={{ fontWeight: "bold" }}>Mã vật tư</Typography>,
      dataIndex: "materialCode",
      key: "materialCode",
      align: "center",
      render: (_v, record) => (
        <Typography>{record.materialCode ?? ""}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên vật tư</Typography>,
      dataIndex: "name",
      key: "name",
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "uom",
      key: "uom",
      align: "center",
      render: (_v, record) => record.uom ?? "",
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Số lượng</Typography>,
      dataIndex: "quantity",
      key: "quantity",
      width: 130,
      align: "center",
      render: (_v, record) =>
        record.quantity ? record.quantity.toLocaleString() : "",
    },
    {
      title: (
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontWeight: "bold" }}>Đơn giá</Typography>
          <Typography sx={{ fontWeight: "bold" }}>bình quân năm</Typography>
        </Box>
      ),
      dataIndex: "price",
      key: "price",
      align: "center",
      width: 180,
      render: (_v, record) =>
        record.price ? record.price.toLocaleString() : "",
    },
  ];

  const rowSelection: TableRowSelection<FlatMaterial> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const flatData: FlatMaterial[] = data.flatMap(
    (assignment: MaterialAssignmentOutputType) =>
      (assignment.materials || []).map((material: Materials) => ({
        _id: `${assignment._id}-${material.code ?? ""}`,
        code: assignment.code ?? "",
        materialCode: material.code,
        name: material.name ?? "",
        uom: material.uom?.name,
        quantity: material.quantity,
        price: material.currentPrice,
        note: "",
      }))
  );

  const filteredData = flatData.filter((item) =>
    item.code.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.materialCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Đơn giá vật tư giao khoán</Typography>
      </Breadcrumbs>
      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Đơn giá vật tư giao khoán
      </Typography>
      <Box mt={3}>
        <Box sx={{ mb: 2 }}>
          <Box
            display={"flex"}
            gap={4}
            mt={2}
            justifyContent="space-between"
            alignItems="center"
          >
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

        <Table<FlatMaterial>
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
          dataSource={filteredData}
        />
      </Box>
    </Box>
  );
}
