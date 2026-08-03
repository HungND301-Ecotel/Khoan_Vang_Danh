import React, { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
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
import { formatDecimal } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";

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

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<AssignmentNormInputType>
  >(setOpen, "Định mức đào lò");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data: availableYears = [] } = useQuery({
    queryKey: ["assignmentnorm-years", "excavation"],
    queryFn: async () =>
      api
        .get(`/assignmentnorms/years?type=excavation`)
        .then((res) => res.data.data as number[]),
  });

  // Nếu năm hiện tại chưa có trong danh sách (chưa từng tạo dữ liệu), vẫn cho phép chọn để tạo mới
  const yearOptions = useMemo(() => {
    if (availableYears.length === 0) return [currentYear];
    return availableYears.includes(currentYear)
      ? availableYears
      : [currentYear, ...availableYears];
  }, [availableYears, currentYear]);

  // Khi có dữ liệu năm trả về lần đầu, tự set selectedYear = năm mới nhất (nếu năm hiện tại chưa có data)
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]); // năm mới nhất trong data
    }
  }, [availableYears]);

  const { data: assignmentnorms = { totalDOcs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["assignmentnorms", searchValue, page, limit, selectedYear],
      queryFn: async () =>
        api
          .get(
            `/assignmentnorms?q=${searchValue}&page=${page}&limit=${limit}&type=excavation&year=${selectedYear}`,
          )
          .then((res) => res.data.data),
    });

  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", newExcavationNorm).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms"] });
      setOpen(false);
      clearMinimize();
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
      clearMinimize();
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
        const formattedErrors = data.invalidRows.map(
          (err: any) => `Dòng ${err.row || "?"}: ${err.error}`,
        );
        setErrorDialog({ open: true, messages: formattedErrors });
      } else {
        showSuccessAlert(
          `Import thành công! (Thêm: ${data.summary.inserted}, Sửa: ${data.summary.updated}, Xóa: ${data.summary.deleted})`,
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

    const targetId = selected?._id || minimizedData?._id;
    if (targetId) {
      updateMutation.mutate({ ...cleanedValues, _id: targetId });
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

  const handleExport = useMutation({
    mutationFn: () =>
      api.post(
        "/assignmentnorms/exportFile?type=excavation",
        {},
        {
          responseType: "blob",
        },
      ),
    onSuccess: (res: any) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dinh_muc_dao_lo.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessAlert("Xuất file thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lỗi khi xuất file");
    },
  });

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
          <Typography>{formatDecimal(norm)}</Typography>
        ),
      },
    ];

    return (
      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Định mức {record.phase?.name} ({record.excavationTech?.name})
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
      title: <Typography sx={{ fontWeight: "bold" }}>Từ tháng</Typography>,
      dataIndex: "startMonth",
      key: "startMonth",
      render: (_, record) => <Typography>{record.startMonth}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Đến tháng</Typography>,
      dataIndex: "endMonth",
      key: "endMonth",
      render: (_, record) => <Typography>{record.endMonth}</Typography>,
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
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: (theme) => custom_theme.palette.table_name.main,
                  }}
                >
                  Định mức đào lò
                </Typography>
                <TextField
                  select
                  size="small"
                  label="Năm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  sx={{ minWidth: 120 }}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <PageAction
                selectedIds={selectedRows}
                handleDelete={handleDelete}
                deleteMutation={deleteMutation}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                exportExcel={handleExport}
                importFile={importMutation}
                handleOpen={handleOpen}
                handleClearSearch={handleClearSearch}
                isLoading={isLoading}
                totalItems={assignmentnorms.totalDocs}
              />
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
          minimizedData={minimizedData}
          onMinimize={handleMinimize}
          clearMinimize={clearMinimize}
          defaultYear={selectedYear}
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
