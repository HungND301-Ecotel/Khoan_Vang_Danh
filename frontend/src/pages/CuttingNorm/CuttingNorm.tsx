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
import { AssignmentCodeInputType, AssignmentNormOutputType } from "../../types";
import CuttingNormModal from "../../components/CuttingNormModal/CuttingNormModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from '../../theme';

export default function CuttingNorm() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();

  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ["assignmentnorms", searchValue],
    queryFn: async () =>
      api.get(`/assignmentnorms?q=${searchValue}`).then((res) => res.data.data),
  });

 const filteredData = assignmentnorms.filter((i: AssignmentNormOutputType) => {
  const matchesType = i.type === "cutting";
  const matchesSearch =
    searchValue === "" ||
    i.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
    i.norms.some((n) =>
      n.assignmentCode?.name?.toLowerCase().includes(searchValue.toLowerCase())
    );
  return matchesType && matchesSearch;
});

  const createMutation = useMutation({
    mutationFn: (newCuttingNorm: Partial<AssignmentCodeInputType>) =>
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
    mutationFn: (updateCuttingNorm: Partial<AssignmentCodeInputType>) =>
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

  const handleDelete = (id?: string) => {
    if (!id) {
      if (selectedRows.length === 0) {
        showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
        return;
      }

      showConfirmAlert(
        `Bạn có muốn xóa ${selectedRows.length} bản ghi đã chọn?`
      ).then((result) => {
        if (result.isConfirmed) {
          deleteMultipleMutation.mutate(selectedRows as string[]);
        }
      });
      return;
    }

    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate([id]);
      }
    });
  };

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      return api.delete("/assignmentnorms", { data: { ids } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || "Lỗi khi xóa");
      showErrorAlert(error.response?.data?.message || "Lỗi khi xóa dữ liệu");
    },
  });

  const handleSubmit = (values: Partial<AssignmentCodeInputType>) => {
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined
      )
    );

    if (selected) {
      updateMutation.mutate({ ...cleanedValues, _id: selected._id });
    } else {
      createMutation.mutate(cleanedValues);
    }
  };

  const handleOpen = (cuttingNorm?: AssignmentNormOutputType) => {
    if (cuttingNorm) {
      setSelected(cuttingNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  const expandedRowRender = (record: AssignmentNormOutputType) => {
    const innerColumns = [
      {
        title: "STT",
        dataIndex: "index",
        key: "index",
        width: 60,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold", color: "black" }}>
            Mã giao khoán
          </Typography>
        ),
        dataIndex: "assignmentCode",
        key: "assignmentCode",
        render: (assignmentCode: any) => (
          <Typography sx={{ color: "black" }}>
            {assignmentCode?.code}
          </Typography>
        ),
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>Tên vật liệu</Typography>
        ),
        dataIndex: "assignmentCode",
        key: "name",
        render: (assignmentCode: any) => assignmentCode?.name,
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Đơn vị</Typography>,
        dataIndex: "assignmentCode",
        key: "uom",
        render: (assignmentCode: any) => assignmentCode?.uom?.name,
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "norm",
        key: "norm",
        render: (norm: number) => (norm ? norm.toLocaleString() : ""),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Xén trong đá: 
            {record.phase?.name || ""} {record.hardness?.name || ""}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Tiết diện lò xén: {record.crossSection?.name || ""} (
            {record.crossSection?.uom?.name || ""})
          </Typography>
        </Box>
        <Table
          columns={innerColumns}
          dataSource={record.norms}
          pagination={false}
          size="small"
          rowKey={(item) =>
            `${record._id}-${
              item.assignmentCode?._id ||
              item.assignmentCode?.code ||
              Math.random()
            }`
          }
        />
      </Box>
    );
  };

  const columns: TableProps<AssignmentNormOutputType>["columns"] = [
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
      title: (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>
        </Box>
      ),
      dataIndex: "view",
      key: "view",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={() => {
              const key = record._id as React.Key;
              if (expandedRowKeys.includes(key)) {
                setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
              } else {
                setExpandedRowKeys([...expandedRowKeys, key]);
              }
            }}
            size="small"
          >
            <Visibility />
          </IconButton>
        </Box>
      ),
    },
    {
      title: (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>
        </Box>
      ),
      dataIndex: "edit",
      key: "edit",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Box display="flex" justifyContent="center">
          <IconButton onClick={() => handleOpen(record)} size="small">
            <Edit  />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<AssignmentNormOutputType> = {
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
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Định mức xén lò</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main }}>
              Định mức xén lò
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
          <Table<AssignmentNormOutputType>
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
      <CuttingNormModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
      />
    </Box>
  );
}