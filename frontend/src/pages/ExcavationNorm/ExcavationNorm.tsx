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
import { AssignmentNormInputType, AssignmentNormOutputType } from "../../types";
import ExcavationNormModal from "./ExcavationNormModal/ExcavationNormModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import ImportErrorDialog from "../../components/ImportErrorDialog/ImportErrorDialog";

export default function ExcavationNorm() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    messages: [] as string[],
  });

  const queryClient = useQueryClient();

  const { data: assignmentnorms = { totalDOcs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["assignmentnorms", searchValue, page, limit],
      queryFn: async () =>
        api
          .get(
            `/assignmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=excavation`,
          )
          .then((res) => res.data.data),
    });

  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", newExcavationNorm).then((res) => res.data),
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
    mutationFn: (updateExcavationNorm: Partial<AssignmentNormInputType>) =>
      api
        .put(
          `/assignmentnorms/${updateExcavationNorm._id}`,
          updateExcavationNorm,
        )
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

  const deleteMutation = useMutation({
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

  const importMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api
        .post("/assignmentnorms/importFile?type=excavation", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });

      if (data.invalidRows?.length > 0) {
        // Chuyển đổi dữ liệu lỗi từ Backend thành mảng chuỗi để Dialog hiển thị
        const formattedErrors = data.invalidRows.map(
          (err: any) => `Dòng ${err.row || "?"}: ${err.error}`,
        );
        setErrorDialog({ open: true, messages: formattedErrors });
      } else {
        showSuccessAlert(
          `Import thành công! (Thêm: ${data.summary.inserted}, Sửa: ${data.summary.updated})`,
        );
      }
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lỗi khi import file");
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

  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );

    if (selected) {
      updateMutation.mutate({ ...cleanedValues, _id: selected._id });
    } else {
      createMutation.mutate(cleanedValues);
    }
  };

  const handleOpen = (excavationNorm?: AssignmentNormOutputType) => {
    if (excavationNorm) {
      setSelected(excavationNorm);
    } else {
      setSelected(null);
    }
    setOpen(true);
  };

  const handleExport = async () => {
    try {
      const res = await api.post(
        "/assignmentnorms/exportFile?type=excavation",
        {},
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dinh_muc_dao_lo.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessAlert("Xuất file thành công");
    } catch (error) {
      console.error(error);
      showErrorAlert("Không thể xuất file");
    }
  };

  const handleImportClick = () => {
    const fileInput = document.getElementById("import-file-input");
    if (fileInput) fileInput.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    importMutation.mutate(formData);

    e.target.value = "";
  };

  const expandedRowRender = (record: AssignmentNormOutputType) => {
    const innerColumns = [
      {
        title: <Typography sx={{ fontWeight: "bold" }}>STT</Typography>,
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
          <Typography>{assignmentCode?.code}</Typography>
        ),
      },
      {
        title: (
          <Typography sx={{ fontWeight: "bold" }}>
            Tên vật tư, tài sản
          </Typography>
        ),
        dataIndex: "assignmentCode",
        key: "name",
        render: (assignmentCode: any) => (
          <Typography>{assignmentCode?.name}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
        dataIndex: "assignmentCode",
        key: "uom",
        render: (assignmentCode: any) => (
          <Typography>{assignmentCode?.uom?.name}</Typography>
        ),
      },
      {
        title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
        dataIndex: "norm",
        key: "norm",
        render: (norm: number) => (
          <Typography>{norm ? norm.toLocaleString() : ""}</Typography>
        ),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Định mức {record.phase?.name} {record.hardness?.name} (
            {record.excavationTech?.name})
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {record.phaseGroup?.name} {record.step?.name}
          </Typography>
        </Box>
        <Table
          columns={innerColumns}
          dataSource={record.norms}
          pagination={false}
          size="small"
          rowKey={(item) =>
            `${record._id}-${item.assignmentCode?._id || Math.random()}`
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
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>
          Mã định mức giao khoán
        </Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_, record) => <Typography>{record.code}</Typography>,
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
            <Edit />
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

  const handleClearSearch = () => {
    setSearchValue("");
  };

  return (
    <>
      <Box
        sx={{
          px: 5,
          py: 1,
        }}
      >
        <Breadcrumbs aria-label="breadcrumb">
          <Typography>Đơn giá và định mức</Typography>
          <Typography>Định mức đào lò</Typography>
        </Breadcrumbs>
        <Box mt={3}>
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h4"
                sx={{ color: (theme) => custom_theme.palette.table_name.main }}
              >
                Định mức đào lò
              </Typography>
              <Box
                display={"flex"}
                gap={4}
                mt={2}
                justifyContent="space-between"
              >
                <Box display={"flex"} gap={2}>
                  <Button
                    variant="contained"
                    endIcon={<Add />}
                    onClick={() => handleOpen()}
                    sx={{
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_add_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_add_button.dark,
                      },
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
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_delete_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_delete_button.dark,
                      },
                      fontFamily: "Roboto, sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: "8px",
                      px: 3,
                    }}
                  >
                    {deleteMutation.isPending
                      ? "Đang xóa..."
                      : `Xóa (${selectedRows.length})`}
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
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_functional_button.dark,
                        boxShadow:
                          custom_theme.customShadows.tableFunctionalHover,
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
                    sx={{
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_filter_box.main,
                    }}
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
                  {/* Input ẩn để chọn file */}
                  <input
                    type="file"
                    id="import-file-input"
                    style={{ display: "none" }}
                    accept=".xlsx, .xls"
                    onChange={onFileChange}
                  />

                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<FileUpload />}
                    onClick={handleImportClick} // Gọi hàm trigger input file (thường là document.getElementById('import-file-input').click())
                    disabled={importMutation.isPending}
                    sx={{
                      border: "none",
                      boxShadow: custom_theme.customShadows.tableFunctional,
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_functional_button.dark,
                        boxShadow:
                          custom_theme.customShadows.tableFunctionalHover,
                      },
                      fontFamily: "Roboto, sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: "8px",
                      px: 3,
                    }}
                  >
                    {importMutation.isPending ? "Đang tải..." : "Tải lên"}
                  </Button>

                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<FileDownload />}
                    onClick={handleExport}
                    sx={{
                      border: "none",
                      boxShadow: custom_theme.customShadows.tableFunctional,
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_functional_button.dark,
                        boxShadow:
                          custom_theme.customShadows.tableFunctionalHover,
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
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_functional_button.dark,
                        boxShadow:
                          custom_theme.customShadows.tableFunctionalHover,
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
                      backgroundColor: (theme) =>
                        custom_theme.palette.table_functional_button.main,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          custom_theme.palette.table_functional_button.dark,
                        boxShadow:
                          custom_theme.customShadows.tableFunctionalHover,
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
            <CustomTable<AssignmentNormOutputType>
              data={assignmentnorms.data}
              total={assignmentnorms.totalDocs}
              page={page}
              limit={limit}
              columns={columns}
              rowSelection={rowSelection}
              onPageChange={(p, ps) => {
                setPage(p);
                setLimit(ps);
              }}
              isLoading={isLoading}
              searchValue={searchValue}
              handleClearSearch={handleClearSearch}
              expandable={{
                expandedRowKeys,
                onExpandedRowsChange: (keys) =>
                  setExpandedRowKeys(keys as React.Key[]),
                expandedRowRender,
                showExpandColumn: false,
              }}
            />
          </Box>
        </Box>
        <ExcavationNormModal
          open={open}
          setOpen={setOpen}
          handleSubmit={handleSubmit}
          selected={selected}
          hasExistingRecords={assignmentnorms.totalDocs > 1}
          existingNorms={assignmentnorms.data}
        />
      </Box>
      <ImportErrorDialog
        open={errorDialog.open}
        errors={errorDialog.messages}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
      />
    </>
  );
}
