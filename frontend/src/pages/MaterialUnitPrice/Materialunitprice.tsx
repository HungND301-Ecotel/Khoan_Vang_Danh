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
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import api from "../../config/api.config";
import {
  AssignmentCodeInputType,
  MaterialAssignmentInputType,
  MaterialAssignmentOutputType,
} from "../../types";
import { showErrorAlert, showSuccessAlert } from "../../components/Alert";

export default function Materialunitprice() {
  const queryClient = useQueryClient();
  const [selectedAssignments, setSelectedAssignments] = useState<React.Key[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");

  const { data: materialAssignments = [] } = useQuery({
    queryKey: ["materialAssignments", searchValue],
    queryFn: () =>
      api
        .get(`/materialassignments?q=${searchValue}`)
        .then((res) => res.data.data),
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

  const columns: TableProps<MaterialAssignmentOutputType>["columns"] = [
    {
      title: "Mã giao khoán",
      dataIndex: "code",
      key: "code",
      render: (value) => (
        <Typography sx={{ fontWeight: "bold" }}>{value}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: "Tên vật tư, tài sản",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "ĐVT",
      dataIndex: "uom",
      key: "uom",
    },
    {
      title: "Đơn giá bình quân năm",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (value) => (value ? value.toLocaleString() : ""),
    },
  ];

  const rowSelection: TableRowSelection<MaterialAssignmentOutputType> = {
    selectedRowKeys: selectedAssignments,
    onChange: (newSelectedAssignments: React.Key[]) => {
      setSelectedAssignments(newSelectedAssignments);
    },
  };

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Đơn giá vật tư giao khoán</Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ color: "blue" }}>
              Đơn giá vật tư
            </Typography>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              {/* Action buttons trái */}
              <Box display={"flex"} gap={2}>
                <Button variant="contained" color="warning" endIcon={<Add />}>
                  Tạo mới
                </Button>
                <Button variant="contained" color="error" endIcon={<Delete />}>
                  Xóa
                </Button>
              </Box>

              {/* Search + filter */}
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

              {/* Export / import */}
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

          {/* Table antd */}
          <Table<MaterialAssignmentOutputType>
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
            dataSource={materialAssignments}
          />
        </Box>
      </Box>
    </Box>
  );
}
