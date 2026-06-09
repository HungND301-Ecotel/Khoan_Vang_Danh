import React, { Fragment, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Box,
  MenuItem,
  Grid,
  Typography,
  Breadcrumbs,
  Tabs,
  Tab,
  Checkbox,
  Button,
  Badge,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  MaterialAssignmentOutputType,
  MaterialBudgetInputType,
  PhaseOutputType,
  ProductionScopeOutputType,
} from "../../types";
import {
  ArrowDropDown,
  CalendarToday,
  FileDownload,
  Mail,
  Print,
  Save,
  Undo,
} from "@mui/icons-material";
import custom_theme from "../../theme";
import FieldMonthYear from "../../ui/FieldMonth_Year";
import dayjs from "dayjs";
import { showErrorAlert } from "../../components/Alert";
import { parseAxiosError } from "../../utils/handleApiError";
import SettlementService from "../../service/SettlementRepotr";
import { formatDecimal, formattedPrice } from "../../utils/helpers";

export default function SettlementReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs(new Date()).format("YYYY-MM"),
  );
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedProductionScope, setSelectedProductionScope] = useState("");
  const [dragOverAssignmentId, setDragOverAssignmentId] = useState<
    string | null
  >(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<any[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      materialCostId: string;
      materialItemId: string;
      newAssignmentCodeId: string | null;
      newPrice: number | null;
    }>
  >([]);
  const [discardHighlight, setDiscardHighlight] = useState<Set<string>>(
    new Set(),
  );

  const queryClient = useQueryClient();

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res) => res.data.data),
  });
  const { data: contractsettlements = { data: [], info: {} }, isLoading } =
    useQuery({
      queryKey: [
        "contractsettlements",
        selectedMonth,
        selectedPhase,
        selectedProductionScope,
      ],
      queryFn: () =>
        api
          .get(
            `/contractsettlements/getMonth?month=${selectedMonth}&phase=${selectedPhase}&productionScope=${selectedProductionScope}`,
          )
          .then((res) => res.data.data),
      enabled: !!selectedMonth && !!selectedProductionScope,
    });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

  // Sync localData khi server data thay đổi (sau khi lưu hoặc query mới)
  useEffect(() => {
    if (contractsettlements.data) {
      setLocalData(contractsettlements.data);
      setPendingChanges([]);
    }
  }, [contractsettlements.data]);

  // Kéo thả: chỉ cập nhật UI local, chưa gọi API
  const handleDrop = (
    newAssignmentCodeId: string | null,
    fromAssignmentCodeId: string,
    payload: { materialCostId: string; materialItemId: string },
    newPrice: number | null,
  ) => {
    const targetKey = newAssignmentCodeId ?? "NO_ASSIGNMENTCODE";
    if (fromAssignmentCodeId === targetKey) return;

    setLocalData((prev) => {
      let draggedItem: any = null;
      // Tách item ra khỏi nhóm cũ
      const cleaned = prev.map((group) => {
        const found = group.materialUseds.find(
          (m: any) => m.materialItemId === payload.materialItemId,
        );
        if (found) draggedItem = found;
        return {
          ...group,
          materialUseds: group.materialUseds.filter(
            (m: any) => m.materialItemId !== payload.materialItemId,
          ),
        };
      });
      if (!draggedItem) return prev;
      // Thêm vào nhóm mới
      return cleaned.map((group) => {
        const groupKey = group?.assignmentCode?._id ?? "NO_ASSIGNMENTCODE";
        if (groupKey === targetKey) {
          return {
            ...group,
            materialUseds: [...group.materialUseds, draggedItem],
          };
        }
        return group;
      });
    });

    // Track pending (deduplicate: 1 item chỉ có 1 change mới nhất)
    setPendingChanges((prev) => [
      ...prev.filter((c) => c.materialItemId !== payload.materialItemId),
      {
        materialCostId: payload.materialCostId,
        materialItemId: payload.materialItemId,
        newAssignmentCodeId,
        newPrice,
      },
    ]);
  };

  const exportExcel = useMutation({
    mutationFn: () =>
      SettlementService.exportFile({
        month: selectedMonth,
        phase: selectedPhase,
        productionScope: selectedProductionScope,
      }),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        pendingChanges.map((change) =>
          api.patch("/contractsettlements/updateMaterialAssignmentCode", {
            materialCostId: change.materialCostId,
            materialItemId: change.materialItemId,
            newAssignmentCodeId: change.newAssignmentCodeId,
            newPrice: change.newPrice ?? null,
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "contractsettlements",
          selectedMonth,
          selectedPhase,
          selectedProductionScope,
        ],
      });
    },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const handleDiscard = () => {
    // 1. Ghi nhớ các id sắp bị hoàn tác để highlight
    const ids = new Set(pendingChanges.map((c) => c.materialItemId));
    // 2. Reset data về server (item nhảy về vị trí cũ)
    setLocalData(contractsettlements.data ?? []);
    setPendingChanges([]);
    // 3. Bật highlight rồi tắt sau 700ms (fade out qua CSS transition)
    setDiscardHighlight(ids);
    setTimeout(() => setDiscardHighlight(new Set()), 700);
  };

  const hasPending = pendingChanges.length > 0;

  const isShow = selectedPhase && selectedProductionScope;

  return (
    <Paper sx={{ width: "calc(100vw - 148px)", p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Box
          display={"flex"}
          gap={4}
          mt={2}
          sx={{
            justifyContent: { md: "space-between", xs: "flex-start" },
            flexDirection: { md: "row", xs: "column" },
          }}
        >
          <Box display={"flex"} gap={2}>
            <Grid container spacing={2} mb={3} alignItems="center">
              <Grid item xs={4}>
                <FieldMonthYear
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                />
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  disablePortal
                  size="small"
                  options={productionscopes?.data || []}
                  getOptionLabel={(option: any) => option.code}
                  value={productionscopes?.data?.find(
                    (i: any) => i._id === selectedProductionScope,
                  )}
                  onChange={(e, value: any) =>
                    setSelectedProductionScope(value?._id || "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn diện sản xuất"
                      size="small"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  disablePortal
                  size="small"
                  options={phases?.data || []}
                  getOptionLabel={(option: any) => option.code}
                  value={phases?.data?.find(
                    (i: any) => i._id === selectedPhase,
                  )}
                  onChange={(e, value: any) =>
                    setSelectedPhase(value?._id || "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chọn công đoạn"
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            {hasPending && (
              <>
                <Tooltip title={`${pendingChanges.length} thay đổi chưa lưu`}>
                  <Badge badgeContent={pendingChanges.length} color="warning">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Save />}
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      sx={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        textTransform: "none",
                        borderRadius: "4px",
                        px: 2,
                        py: 0.5,
                        height: 32,
                      }}
                    >
                      {saveMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </Badge>
                </Tooltip>
                <Tooltip title="Hủy tất cả thay đổi chưa lưu">
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<Undo />}
                    onClick={handleDiscard}
                    sx={{
                      fontFamily: "Roboto, sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: "4px",
                      px: 2,
                      py: 0.5,
                      height: 32,
                      borderColor: "#ccc",
                    }}
                  >
                    Hủy
                  </Button>
                </Tooltip>
              </>
            )}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileDownload />}
              onClick={() => exportExcel.mutate()}
              sx={{
                border: "none",
                boxShadow: custom_theme.customShadows.tableFunctional,
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.main,
                "&:hover": {
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_functional_button.dark,
                  boxShadow: custom_theme.customShadows.tableFunctionalHover,
                },
                fontFamily: "Roboto, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                minWidth: 90,
                height: 32,
              }}
            >
              Xuất file
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Print />}
              // onClick={handlePrint}
              sx={{
                border: "none",
                boxShadow: custom_theme.customShadows.tableFunctional,
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.main,
                "&:hover": {
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_functional_button.dark,
                  boxShadow: custom_theme.customShadows.tableFunctionalHover,
                },
                fontFamily: "Roboto, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                minWidth: 90,
                height: 32,
              }}
            >
              In
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Mail />}
              endIcon={<ArrowDropDown />}
              // onClick={handleSend}
              sx={{
                border: "none",
                boxShadow: custom_theme.customShadows.tableFunctional,
                backgroundColor: (theme) =>
                  custom_theme.palette.table_functional_button.main,
                "&:hover": {
                  backgroundColor: (theme) =>
                    custom_theme.palette.table_functional_button.dark,
                  boxShadow: custom_theme.customShadows.tableFunctionalHover,
                },
                fontFamily: "Roboto, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "4px",
                px: 2,
                py: 0.5,
                height: 32,
              }}
            >
              Gửi
            </Button>
          </Box>
        </Box>
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ tableLayout: "auto", width: "100%" }} size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                colSpan={8}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

              <TableCell
                align="center"
                colSpan={isShow ? 13 : 10}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                Quyết toán giao khoán tháng{" "}
                {selectedMonth ? dayjs(selectedMonth).format("MM") : ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                colSpan={8}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

              <TableCell
                align="center"
                colSpan={isShow ? 13 : 10}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                {(contractsettlements.info?.phases || [])
                  .map((i: any) => i?.code)
                  .join(", ")}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                colSpan={8}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

              <TableCell
                align="center"
                colSpan={isShow ? 13 : 10}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                {(contractsettlements.info?.productionScopes || [])
                  .map((i: any) => i?.code)
                  .join(", ")}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                colSpan={8}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

              <TableCell
                align="center"
                colSpan={isShow ? 7 : 4}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                Kế hoạch
              </TableCell>
              <TableCell
                align="center"
                colSpan={4}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                Thực hiện
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#FF620040",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              >
                So sánh lãi(+); lỗ(-)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 42,
                }}
              >
                STT
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.8,
                  minWidth: 117,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Mã vật tư, tài sản
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 60,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Trùng mã vật tư
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 60,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Mã thiết bị
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 55,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Mã giao khoán
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.8,
                  minWidth: 143,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Tên vật tư, tài sản
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 43,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                ĐVT
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 64,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Đơn giá khoán
              </TableCell>
              {isShow && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                    bgcolor: "#F3D01640",
                    fontSize: "14px",
                    p: 0.5,
                    minWidth: 48,
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  Định mức gốc
                </TableCell>
              )}
              {isShow && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                    bgcolor: "#F3D01640",
                    fontSize: "14px",
                    p: 0.5,
                    minWidth: 85,
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  Hệ số điều chỉnh định mức
                </TableCell>
              )}
              {isShow && (
                <TableCell
                  align="center"
                  rowSpan={2}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                    bgcolor: "#F3D01640",
                    fontSize: "14px",
                    p: 0.5,
                    minWidth: 45,
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  Định mức
                </TableCell>
              )}
              <TableCell
                align="center"
                colSpan={3}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "14px",
                  p: 0.5,
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 54,
                }}
              >
                Giá trị
              </TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "14px",
                  p: 0.5,
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 54,
                }}
              >
                Giá trị
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#FF620040",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 52,
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#FF620040",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 54,
                }}
              >
                Giá trị
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 48,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Tổng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 56,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Trong khoán
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#F3D01640",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 57,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Ngoài khoán
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 48,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Tổng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 55,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Trong khoán
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  bgcolor: "#4CAF503D",
                  fontSize: "14px",
                  p: 0.5,
                  minWidth: 55,
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                Ngoài khoán
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  textAlign: "center",
                }}
              >
                1
              </TableCell>
              {Array.from({ length: isShow ? 20 : 17 }).map((_, index) => (
                <TableCell
                  key={index}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: index <= 4 ? "bold" : "normal",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor:
                      index >= 7 && index <= (isShow ? 13 : 10)
                        ? "#F3D01640"
                        : index >= (isShow ? 14 : 11) &&
                            index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) &&
                              index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4
                    ? "Than nguyên khai"
                    : index === 8
                      ? contractsettlements?.info.totalCoal
                        ? Number(
                            contractsettlements?.info.totalCoal.toFixed(1),
                          ).toLocaleString()
                        : ""
                      : ""}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  textAlign: "center",
                }}
              >
                2
              </TableCell>
              {Array.from({ length: isShow ? 20 : 17 }).map((_, index) => (
                <TableCell
                  key={index}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: index <= 4 ? "bold" : "normal",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor:
                      index >= 7 && index <= (isShow ? 13 : 10)
                        ? "#F3D01640"
                        : index >= (isShow ? 14 : 11) &&
                            index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) &&
                              index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4
                    ? "Mét lò đào"
                    : index === 8
                      ? formatDecimal(contractsettlements?.info.totalExcavation)
                      : ""}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  textAlign: "center",
                }}
              >
                3
              </TableCell>
              {Array.from({ length: isShow ? 20 : 17 }).map((_, index) => (
                <TableCell
                  key={index}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: index <= 4 ? "bold" : "normal",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor:
                      index >= 7 && index <= (isShow ? 13 : 10)
                        ? "#F3D01640"
                        : index >= (isShow ? 14 : 11) &&
                            index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) &&
                              index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4
                    ? "Mét lò xén"
                    : index === 8
                      ? formatDecimal(contractsettlements?.info.totalCutting)
                      : ""}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  textAlign: "center",
                }}
              >
                4
              </TableCell>
              {Array.from({ length: isShow ? 20 : 17 }).map((_, index) => (
                <TableCell
                  key={index}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: index <= 4 ? "bold" : "normal",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor:
                      index >= 7 && index <= (isShow ? 13 : 10)
                        ? "#F3D01640"
                        : index >= (isShow ? 14 : 11) &&
                            index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) &&
                              index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4
                    ? "Tỉ lệ đá lẫn trong gương (Ckep)"
                    : index === 8
                      ? contractsettlements.info?.rockRatio
                      : ""}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "14px",
                  p: 0.5,
                  textAlign: "center",
                }}
              >
                5
              </TableCell>
              {Array.from({ length: isShow ? 20 : 17 }).map((_, index) => (
                <TableCell
                  key={index}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: index <= 4 ? "bold" : "normal",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor:
                      index >= 7 && index <= (isShow ? 13 : 10)
                        ? "#F3D01640"
                        : index >= (isShow ? 14 : 11) &&
                            index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) &&
                              index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Vật tư có định mức" : ""}
                </TableCell>
              ))}
            </TableRow>
            {localData.map((assignment: any, index: number) => (
              <Fragment
                key={
                  (
                    assignment?.assignmentCode ||
                    assignment.assignmentCode !== null
                  )?._id
                }
              >
                {/* ── GROUP HEADER ROW – drop target ── */}
                <TableRow
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const targetId =
                      assignment?.assignmentCode?._id ?? "NO_ASSIGNMENTCODE";
                    setDragOverAssignmentId(targetId);
                  }}
                  onDragLeave={(e) => {
                    // chỉ clear khi rời khỏi hẳn row (không phải child element)
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverAssignmentId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverAssignmentId(null);
                    try {
                      const payload = JSON.parse(
                        e.dataTransfer.getData("application/json"),
                      );
                      const newAssignmentCodeId =
                        assignment?.assignmentCode?._id ?? null;
                      const newPrice: number | null = assignment?.price ?? null;
                      handleDrop(
                        newAssignmentCodeId,
                        payload.fromAssignmentCodeId,
                        {
                          materialCostId: payload.materialCostId,
                          materialItemId: payload.materialItemId,
                        },
                        newPrice,
                      );
                    } catch {}
                  }}
                  sx={{
                    outline:
                      dragOverAssignmentId ===
                      (assignment?.assignmentCode?._id ?? "NO_ASSIGNMENTCODE")
                        ? "2px dashed #1976d2"
                        : "none",
                    outlineOffset: "-2px",
                    bgcolor:
                      dragOverAssignmentId ===
                      (assignment?.assignmentCode?._id ?? "NO_ASSIGNMENTCODE")
                        ? "#e3f2fd"
                        : "inherit",
                    transition: "background-color 0.15s, outline 0.15s",
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {index + 6}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  ></TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      color: "black",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  ></TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      color: "black",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {assignment?.assignmentCode?.deviceCode?.code}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {
                      (
                        assignment?.assignmentCode ||
                        assignment.assignmentCode !== null
                      )?.code
                    }
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {assignment?.assignmentCode &&
                    assignment.assignmentCode !== null
                      ? assignment?.assignmentCode?.name
                      : "Vật tư không có định mức"}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "normal",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {assignment?.assignmentCode?.uom?.name}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "normal",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode !== null
                      ? formattedPrice(assignment?.price)
                      : ""}
                  </TableCell>
                  {isShow && (
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640",
                      }}
                    >
                      {assignment?.assignmentCode ||
                      assignment.assignmentCode !== null
                        ? formatDecimal(assignment?.baseNorm)
                        : ""}
                    </TableCell>
                  )}
                  {isShow && (
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640",
                      }}
                    >
                      {assignment?.assignmentCode ||
                      assignment.assignmentCode !== null
                        ? formatDecimal(assignment?.adjustmentNorm)
                        : ""}
                    </TableCell>
                  )}
                  {isShow && (
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640",
                      }}
                    >
                      {assignment?.assignmentCode ||
                      assignment.assignmentCode !== null
                        ? formatDecimal(assignment?.norm)
                        : ""}
                    </TableCell>
                  )}
                  {Array.from({ length: 10 }).map((_, index) => (
                    <TableCell
                      key={index}
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor:
                          index >= 0 && index <= 3
                            ? "#F3D01640"
                            : index >= 4 && index <= 7
                              ? "#4CAF503D"
                              : index >= 8 && index <= 9
                                ? "#FF620040"
                                : "white",
                      }}
                    >
                      {index === 0
                        ? assignment?.assignmentCode
                          ? formatDecimal(assignment?.plan_Quantity)
                          : ""
                        : index === 1
                          ? ""
                          : index === 2
                            ? ""
                            : index === 3
                              ? assignment?.assignmentCode
                                ? formattedPrice(assignment?.plan_Cost)
                                : ""
                              : index === 4
                                ? assignment?.assignmentCode
                                  ? formatDecimal(assignment?.used_Quantity)
                                  : ""
                                : index === 5
                                  ? ""
                                  : index === 6
                                    ? ""
                                    : index === 7
                                      ? assignment?.assignmentCode
                                        ? formattedPrice(assignment?.used_Cost)
                                        : ""
                                      : index === 8
                                        ? assignment?.assignmentCode
                                          ? formatDecimal(
                                              assignment?.varianceQuantity,
                                            )
                                          : ""
                                        : index === 9
                                          ? assignment?.assignmentCode
                                            ? formattedPrice(
                                                assignment?.varianceCost,
                                              )
                                            : ""
                                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
                {assignment?.materialUseds.map(
                  (materialUsed: any, i: number) => {
                    const duplicateCount = localData.reduce(
                      (acc: number, asg: any) =>
                        acc +
                        (asg?.materialUseds || []).filter(
                          (mat: any) =>
                            mat.material?._id === materialUsed?.material?._id,
                        ).length,
                      0,
                    );
                    const isDuplicate = duplicateCount > 1;

                    return (
                      <TableRow
                        key={materialUsed?.materialItemId ?? i}
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggingItemId(materialUsed?.materialItemId);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({
                              materialCostId: materialUsed?.materialCostId,
                              materialItemId: materialUsed?.materialItemId,
                              fromAssignmentCodeId:
                                assignment?.assignmentCode?._id ??
                                "NO_ASSIGNMENTCODE",
                            }),
                          );
                        }}
                        onDragEnd={() => setDraggingItemId(null)}
                        sx={{
                          opacity:
                            draggingItemId === materialUsed?.materialItemId
                              ? 0.4
                              : 1,
                          cursor: "grab",
                          "&:active": { cursor: "grabbing" },
                          transition:
                            "opacity 0.15s, background-color 0.7s ease",
                          "&:hover": { bgcolor: "#f5f5f5" },
                          bgcolor: discardHighlight.has(
                            materialUsed?.materialItemId,
                          )
                            ? "#fff3cd"
                            : isDuplicate
                              ? "#ffebee"
                              : "transparent",
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {materialUsed?.material?.code}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            color: "black",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {duplicateCount}
                        </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                          color: "black",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      ></TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                          color: "black",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      ></TableCell>
                      <TableCell
                        sx={{
                          border: "1px solid #ddd",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      >
                        {materialUsed?.material?.name}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      >
                        {materialUsed?.material?.uom?.name}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "normal",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      >
                        {assignment?.assignmentCode ||
                        assignment.assignmentCode !== null
                          ? ""
                          : formattedPrice(materialUsed?.price)}
                      </TableCell>
                      {isShow && (
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "normal",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor: "#F3D01640",
                          }}
                        ></TableCell>
                      )}
                      {isShow && (
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "normal",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor: "#F3D01640",
                          }}
                        ></TableCell>
                      )}
                      {isShow && (
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "normal",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor: "#F3D01640",
                          }}
                        ></TableCell>
                      )}
                      {Array.from({ length: 10 }).map((_, index) => (
                        <TableCell
                          key={index}
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "normal",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor:
                              index >= 0 && index <= 3
                                ? "#F3D01640"
                                : index >= 4 && index <= 7
                                  ? "#4CAF503D"
                                  : index >= 8 && index <= 9
                                    ? "#FF620040"
                                    : "white",
                          }}
                        >
                          {index === 0
                            ? ""
                            : index === 1
                              ? ""
                              : index === 2
                                ? ""
                                : index === 3
                                  ? ""
                                  : index === 4
                                    ? formatDecimal(materialUsed?.quantity)
                                    : index === 5
                                      ? ""
                                      : index === 6
                                        ? ""
                                        : index === 7
                                          ? assignment?.assignmentCode
                                            ? ""
                                            : formattedPrice(materialUsed?.cost)
                                          : index === 8
                                            ? ""
                                            : index === 9
                                              ? ""
                                              : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
