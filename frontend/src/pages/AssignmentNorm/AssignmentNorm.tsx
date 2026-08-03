// components/AssignmentNorm/AssignmentNormPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Add,
  VisibilityOff,
  Delete,
  ContentCopy,
} from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import api from "../../config/api.config";
import { AssignmentNormInputType, AssignmentNormOutputType } from "../../types";
import AssignmentNormModal from "./components/AssignmentNormModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import ImportErrorDialog from "../../components/ImportErrorDialog/ImportErrorDialog";
import { formatDecimal } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";
import {
  cuttingConfig,
  excavationConfig,
  coalKBConfig,
  coalZHConfig,
  coalZRYConfig,
  FIELD_REGISTRY,
  NormTypeConfig,
} from "../../utils/constant";
import { useSearchParams } from "react-router-dom";

const CONFIG_MAP: Record<string, NormTypeConfig> = {
  excavation: excavationConfig,
  cutting: cuttingConfig,
  coal_kb: coalKBConfig,
  coal_zh: coalZHConfig,
  coal_zry: coalZRYConfig,
};

// Kiểu dữ liệu của 1 hàng ở bảng cha (đã group theo code)
interface GroupedAssignmentNorm {
  _id?: string;
  code: string;
  type: string;
  year: number;
  startMonth: string;
  endMonth: string;
  recordCount: number;
  latestRecordId: string;
  totalNorm: number;
}

// ---------- Bảng con cấp 1: danh sách thời gian của 1 mã ----------
function CodeDateRangesTable({
  code,
  type,
  year,
  config,
  onEdit,
  onDeleteRecord,
}: {
  code: string;
  type: string;
  year: number;
  config: NormTypeConfig;
  onEdit: (record: AssignmentNormOutputType) => void;
  onDeleteRecord: (id: string) => void;
}) {
  const [normExpandedKeys, setNormExpandedKeys] = useState<React.Key[]>([]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["assignmentnorms-by-code", code, type, year],
    queryFn: () =>
      api
        .get(`/assignmentnorms/byCode/${code}?type=${type}&year=${year}`)
        .then((res) => res.data.data as AssignmentNormOutputType[]),
  });

  // Bảng cấp 2: chi tiết định mức theo mã giao khoán (giống ảnh 2)
  const normDetailColumns = [
    {
      title: <Typography sx={{ fontWeight: "bold" }}>STT</Typography>,
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã giao khoán</Typography>,
      dataIndex: "assignmentCode",
      key: "assignmentCode",
      render: (ac: any) => <Typography>{ac?.code}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên vật tư, tài sản</Typography>
      ),
      dataIndex: "assignmentCode",
      key: "name",
      render: (ac: any) => <Typography>{ac?.name}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "assignmentCode",
      key: "uom",
      render: (ac: any) => <Typography>{ac?.uom?.name}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Định mức</Typography>,
      dataIndex: "norm",
      key: "norm",
      render: (n: number) => <Typography>{formatDecimal(n)}</Typography>,
    },
  ];

  const renderNormInfoHeader = (record: AssignmentNormOutputType) => (
    <Box sx={{ mb: 2 }}>
      {config.hasPhase !== false ? (
        <>
          <Typography variant="subtitle1">
            {record.phase?.name}
            {config.extraFields.length > 0
              ? ` (${config.extraFields
                  .map((key) => (record as any)[key]?.name)
                  .filter(Boolean)
                  .join(" - ")})`
              : ""}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {record.phaseGroup?.name}
          </Typography>
        </>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {config.extraFields.map((key) => {
            const value = (record as any)[key]?.name;
            if (!value) return null;
            return (
              <Box key={key} sx={{ display: "flex" }}>
                <Typography sx={{ minWidth: 160, color: "text.secondary" }}>
                  {FIELD_REGISTRY[key].label}
                </Typography>
                <Typography>{value}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  const dateRangeColumns: TableProps<AssignmentNormOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Thời gian</Typography>,
      key: "range",
      render: (_, r) => (
        <Typography>{`${r.startMonth} -> ${r.endMonth}`}</Typography>
      ),
    },
    {
      title: (
        <Box display="flex" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>
        </Box>
      ),
      key: "view",
      width: 80,
      align: "center",
      render: (_, r) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            size="small"
            onClick={() => {
              const key = r._id as React.Key;
              setNormExpandedKeys((prev) => (prev.includes(key) ? [] : [key]));
            }}
          >
            {normExpandedKeys.includes(r._id as React.Key) ? (
              <Visibility />
            ) : (
              <VisibilityOff />
            )}
          </IconButton>
        </Box>
      ),
    },
    {
      title: (
        <Box display="flex" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>
        </Box>
      ),
      key: "edit",
      width: 80,
      align: "center",
      render: (_, r) => (
        <Box display="flex" justifyContent="center">
          <IconButton size="small" onClick={() => onEdit(r)}>
            <Edit />
          </IconButton>
        </Box>
      ),
    },
    {
      title: (
        <Box display="flex" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Xóa</Typography>
        </Box>
      ),
      key: "delete",
      width: 80,
      align: "center",
      render: (_, r) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            size="small"
            onClick={() => onDeleteRecord(r._id as string)}
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ backgroundColor: "#fafafa", p: 2, borderRadius: 1 }}>
      <Table
        columns={dateRangeColumns}
        dataSource={records}
        loading={isLoading}
        pagination={false}
        size="small"
        rowKey="_id"
        expandable={{
          expandedRowKeys: normExpandedKeys,
          onExpandedRowsChange: (keys) =>
            setNormExpandedKeys(keys as React.Key[]),
          showExpandColumn: false,
          expandedRowRender: (record) => (
            <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
              {renderNormInfoHeader(record)}{" "}
              <Table
                columns={normDetailColumns}
                dataSource={record.norms}
                pagination={false}
                size="small"
                rowKey={(item) =>
                  `${record._id}-${item.assignmentCode?._id || Math.random()}`
                }
              />
            </Box>
          ),
        }}
      />
    </Box>
  );
}

// ---------- Trang chính ----------
export default function AssignmentNormPage({
  config: configProp,
  embedded = false,
}: {
  config?: NormTypeConfig;
  embedded?: boolean;
} = {}) {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(
    null,
  );
  const [prefillData, setPrefillData] =
    useState<Partial<AssignmentNormOutputType> | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    messages: [] as string[],
  });

  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") || "excavation";

  const config = useMemo(
    () => configProp ?? CONFIG_MAP[typeParam] ?? excavationConfig,
    [configProp, typeParam],
  );

  const queryClient = useQueryClient();
  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<AssignmentNormInputType>
  >(setOpen, config.pageTitle);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data: availableYears = [] } = useQuery({
    queryKey: ["assignmentnorm-years", config.type],
    queryFn: () =>
      api
        .get(`/assignmentnorms/years?type=${config.type}`)
        .then((res) => res.data.data as number[]),
  });

  const yearOptions = useMemo(() => {
    const base = new Set<number>([
      currentYear,
      currentYear + 1,
      ...availableYears,
    ]);
    return Array.from(base).sort((a, b) => b - a);
  }, [availableYears, currentYear]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  // Bảng cha: chỉ lấy danh sách mã (group theo code)
  const { data: assignmentnorms = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: [
        "assignmentnorms-grouped",
        config.type,
        searchValue,
        page,
        limit,
        selectedYear,
      ],
      queryFn: () =>
        api
          .get(
            `/assignmentnorms/grouped?q=${searchValue}&page=${page}&limit=${limit}&type=${config.type}&year=${selectedYear}`,
          )
          .then(
            (res) =>
              res.data.data as {
                totalDocs: number;
                data: GroupedAssignmentNorm[];
              },
          ),
    });

  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneSourceYear, setCloneSourceYear] = useState<number | "">("");
  const [cloneTargetYear, setCloneTargetYear] = useState<number | "">("");

  const openCloneDialog = () => {
    // Năm nguồn: mặc định = năm đang xem, nếu năm đó chưa có data thì fallback năm gần nhất có data
    const sourceDefault = availableYears.includes(selectedYear)
      ? selectedYear
      : (availableYears[0] ?? "");

    // Năm đích: mặc định = năm nguồn + 1
    const targetDefault = sourceDefault ? (sourceDefault as number) + 1 : "";

    setCloneSourceYear(sourceDefault as number | "");
    setCloneTargetYear(targetDefault as number | "");
    setCloneDialogOpen(true);
  };
  useEffect(() => {
    if (!cloneSourceYear) {
      setCloneTargetYear("");
      return;
    }
    setCloneTargetYear((cloneSourceYear as number) + 1);
  }, [cloneSourceYear]);

  const cloneYearMutation = useMutation({
    mutationFn: ({
      sourceYear,
      targetYear,
    }: {
      sourceYear: number;
      targetYear: number;
    }) =>
      api
        .post("/assignmentnorms/cloneYear", {
          type: config.type,
          sourceYear,
          targetYear,
        })
        .then((res) => res.data),
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assignmentnorms-grouped"],
      });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorm-years"] });
      setCloneDialogOpen(false);
      setSelectedYear(variables.targetYear); // 👈 nhảy sang xem luôn năm vừa copy
      const { copied, skipped, total } = data.summary;
      if (total === 0) {
        showErrorAlert("Năm nguồn không có dữ liệu để copy");
      } else if (skipped > 0) {
        showSuccessAlert(
          `Đã copy ${copied}/${total} mã sang năm ${variables.targetYear}. Bỏ qua ${skipped} mã đã tồn tại sẵn.`,
        );
      } else {
        showSuccessAlert(
          `Đã copy ${copied} mã sang năm ${variables.targetYear}.`,
        );
      }
    },
    onError: (error: any) =>
      showErrorAlert(
        error.response?.data?.message || "Lỗi khi nhân bản dữ liệu",
      ),
  });
  const createMutation = useMutation({
    mutationFn: (payload: Partial<AssignmentNormInputType>) =>
      api.post("/assignmentnorms", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-by-code"] });
      setOpen(false);
      clearMinimize();
      showSuccessAlert("Thêm mới thành công");
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<AssignmentNormInputType>) =>
      api
        .put(`/assignmentnorms/${payload._id}`, payload)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-by-code"] });
      setOpen(false);
      clearMinimize();
      setSelected(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi"),
  });

  // Xóa toàn bộ bản ghi của các mã được tick ở bảng cha
  const deleteMutation = useMutation({
    mutationFn: (codes: React.Key[]) =>
      api.delete("/assignmentnorms", {
        data: { codes, year: selectedYear, type: config.type },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-by-code"] });
      setSelectedRows([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi khi xóa dữ liệu"),
  });

  // Xóa 1 bản ghi (khoảng tháng) cụ thể ở bảng con
  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete("/assignmentnorms", { data: { ids: [id] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-by-code"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi khi xóa dữ liệu"),
  });

  const handleDelete = () => {
    if (selectedRows.length === 0)
      return showErrorAlert("Vui lòng chọn ít nhất một mã để xóa");
    showConfirmAlert("Bạn có muốn xóa tất cả bản ghi của các mã đã chọn?").then(
      (result) => {
        if (result.isConfirmed) deleteMutation.mutate(selectedRows);
      },
    );
  };

  const handleDeleteRecord = (id: string) => {
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) deleteRecordMutation.mutate(id);
    });
  };

  const importMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api
        .post(
          `/assignmentnorms/importFile?type=${config.type}&year=${selectedYear}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )
        .then((res) => res.data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["assignmentnorms-by-code"] });
      if (data.invalidRows?.length > 0) {
        setErrorDialog({
          open: true,
          messages: data.invalidRows.map(
            (err: any) => `Dòng ${err.row || "?"}: ${err.error}`,
          ),
        });
      } else {
        showSuccessAlert(
          `Import thành công! (Thêm: ${data.summary.inserted}, Sửa: ${data.summary.updated}, Xóa: ${data.summary.deleted})`,
        );
      }
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi khi import file"),
  });

  const handleExport = useMutation({
    mutationFn: () =>
      api.post(
        `/assignmentnorms/exportFile?type=${config.type}`,
        {
          codes: selectedRows.length > 0 ? selectedRows : undefined,
          year: selectedYear,
        },
        { responseType: "blob" },
      ),
    onSuccess: (res: any) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", config.exportFileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccessAlert("Xuất file thành công");
    },
    onError: (error: any) =>
      showErrorAlert(error.response?.data?.message || "Lỗi khi xuất file"),
  });

  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v != null),
    );
    const targetId = selected?._id || minimizedData?._id;
    if (targetId) updateMutation.mutate({ ...cleanedValues, _id: targetId });
    else createMutation.mutate(cleanedValues);
  };

  // Mở modal sửa 1 bản ghi cụ thể (gọi từ bảng con cấp 1) hoặc tạo mới trắng (nút Thêm mới ở toolbar)
  const handleOpen = (record?: AssignmentNormOutputType) => {
    setSelected(record || null);
    setPrefillData(null);
    setOpen(true);
  };

  // Nút "+" ở bảng cha: lấy dữ liệu bản ghi mới nhất của code, bỏ startMonth/endMonth/_id -> tạo mới
  const handleQuickCreate = async (code: string) => {
    try {
      const res = await api.get(
        `/assignmentnorms/byCode/${code}?type=${config.type}&year=${selectedYear}`,
      );
      const records = res.data.data as AssignmentNormOutputType[];
      if (records.length === 0) {
        showErrorAlert("Không tìm thấy dữ liệu mẫu cho mã này");
        return;
      }
      const latest = records[0]; // BE đã sort giảm dần theo endMonth
      const { _id, startMonth, endMonth, ...rest } = latest;
      setSelected(null);
      setPrefillData(rest);
      setOpen(true);
    } catch (err) {
      showErrorAlert("Không thể tải dữ liệu mẫu");
    }
  };

  // Reset prefill khi đóng modal, tránh dính dữ liệu cho lần mở tiếp theo
  useEffect(() => {
    if (!open) setPrefillData(null);
  }, [open]);

  const columns: TableProps<GroupedAssignmentNorm>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (_v, _r, index) => (
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
      title: <Typography sx={{ fontWeight: "bold" }}>Thời gian</Typography>,
      key: "range",
      render: (_, r) => (
        <Typography>{`${r.startMonth} -> ${r.endMonth}`}</Typography>
      ),
    },
    {
      title: (
        <Box display="flex" justifyContent="center">
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
            size="small"
            onClick={() => {
              const key = record.code as React.Key;
              setExpandedRowKeys((prev) => (prev.includes(key) ? [] : [key]));
            }}
          >
            {expandedRowKeys.includes(record.code as React.Key) ? (
              <Visibility />
            ) : (
              <VisibilityOff />
            )}
          </IconButton>
        </Box>
      ),
    },
    {
      title: (
        <Box display="flex" justifyContent="center">
          <Typography sx={{ fontWeight: "bold" }}>Thêm</Typography>
        </Box>
      ),
      dataIndex: "quickAdd",
      key: "quickAdd",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Box display="flex" justifyContent="center">
          <IconButton
            size="small"
            onClick={() => handleQuickCreate(record.code)}
          >
            <Add />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<GroupedAssignmentNorm> = {
    selectedRowKeys: selectedRows,
    onChange: setSelectedRows,
  };

  // rowSelection cấp cha bỏ đi vì hàng cha không phải bản ghi thật, chọn để xóa nằm ở bảng con
  return (
    <>
      <Box sx={{ px: embedded ? 0 : 5, py: embedded ? 0 : 1 }}>
        {!embedded && (
          <Breadcrumbs aria-label="breadcrumb">
            <Typography>Đơn giá và định mức</Typography>
            <Typography>{config.pageTitle}</Typography>
          </Breadcrumbs>
        )}
        <Box mt={embedded ? 0 : 3}>
          <Box sx={{ mb: 2 }}>
            {!embedded && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Typography
                  variant="h4"
                  sx={{ color: () => custom_theme.palette.table_name.main }}
                >
                  {config.pageTitle}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
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
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopy fontSize="small" />}
                onClick={openCloneDialog}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  height: "40px",
                  whiteSpace: "nowrap",
                }}
              >
                Nhân bản
              </Button>
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
              handleClearSearch={() => setSearchValue("")}
              isLoading={isLoading}
              totalItems={assignmentnorms.totalDocs}
            />
          </Box>
          {!isLoading && assignmentnorms.totalDocs === 0 && !searchValue ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                gap: 2,
                backgroundColor: "#fff",
                borderRadius: 1,
              }}
            >
              <Typography sx={{ color: "text.secondary" }}>
                Năm {selectedYear} chưa có dữ liệu
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={openCloneDialog}
              >
                Sao chép dữ liệu từ năm khác
              </Button>
            </Box>
          ) : (
            <CustomTable<GroupedAssignmentNorm>
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
              handleClearSearch={() => setSearchValue("")}
              expandable={{
                expandedRowKeys,
                onExpandedRowsChange: (keys) => {
                  const arr = keys as React.Key[];
                  setExpandedRowKeys(
                    arr.length > 0 ? [arr[arr.length - 1]] : [],
                  );
                },
                showExpandColumn: false,
                expandedRowRender: (record: GroupedAssignmentNorm) => (
                  <CodeDateRangesTable
                    code={record.code}
                    type={record.type}
                    year={selectedYear}
                    config={config}
                    onEdit={handleOpen}
                    onDeleteRecord={handleDeleteRecord}
                  />
                ),
              }}
            />
          )}
        </Box>

        <AssignmentNormModal
          config={config}
          open={open}
          setOpen={setOpen}
          handleSubmit={handleSubmit}
          selected={selected}
          prefillData={prefillData}
          hasExistingRecords={assignmentnorms.totalDocs > 1}
          existingNorms={[]}
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
      <Dialog open={cloneDialogOpen} onClose={() => setCloneDialogOpen(false)}>
        <DialogTitle>Nhân bản dữ liệu định mức</DialogTitle>
        <DialogContent sx={{ minWidth: 360, pt: 2 }}>
          <Typography sx={{ mb: 2, fontSize: 14, color: "text.secondary" }}>
            Với mỗi mã, hệ thống sẽ lấy dữ liệu của khoảng thời gian mới nhất
            trong năm nguồn, và đặt lại thời gian thành cả năm đích (01 - 12).
            Mã đã tồn tại sẵn ở năm đích sẽ được bỏ qua.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Năm nguồn"
              value={cloneSourceYear}
              onChange={(e) => setCloneSourceYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Năm đích"
              value={cloneTargetYear}
              disabled={!cloneSourceYear}
              onChange={(e) => {
                const val = e.target.value;
                setCloneTargetYear(val === "" ? "" : Number(val));
              }}
              helperText={!cloneSourceYear ? "Chọn năm nguồn trước" : ""}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={
              !cloneSourceYear ||
              !cloneTargetYear ||
              cloneTargetYear === cloneSourceYear ||
              cloneYearMutation.isPending
            }
            onClick={() =>
              cloneYearMutation.mutate({
                sourceYear: cloneSourceYear as number,
                targetYear: cloneTargetYear as number,
              })
            }
          >
            Xác nhận copy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
