import React, { Fragment, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Button,
  Badge,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";

import { Save, Undo } from "@mui/icons-material";
import FieldRangeMonthYear from "../../ui/FieldRangeMonth_Year";
import dayjs from "dayjs";
import { showErrorAlert } from "../../components/Alert";
import { parseAxiosError } from "../../utils/handleApiError";
import SettlementService from "../../service/SettlementRepotr";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import FieldAutoCompleted from "../../components/TextField/FieldAutoCompleted";
import { AppMultiAutocomplete } from "../../components/TextField/AppMultiAutocomplete";
import {
  ContractSettlementResponse,
  DataItem,
  InfoItem,
  MonthlyDataNoPhase,
  MonthlyDataWithPhase,
} from "../../types";
import {
  useSettlementTableData,
  BlockKey,
  RowGroup,
} from "../../hooks/useSettlementTableData";

// Helper tính blockId
const getBlockId = (month: string, phaseId?: string) =>
  phaseId ? `${month}_${phaseId}` : month;

// Số cột data per block
const BLOCK_COLS = 10; // ĐM gốc, HS ĐC, ĐM, KH(T/TK/NK/Giá), TH(T/TK/NK/Giá), SS(SL/Giá)
// Khi isShow=false thì bỏ 3 cột ĐM
const blockColCount = (isShow: boolean) => (isShow ? 10 : 7);

export default function SettlementReport() {
  const [fromMonth, setFromMonth] = useState(
    dayjs(new Date()).format("YYYY-MM"),
  );
  const [toMonth, setToMonth] = useState(dayjs(new Date()).format("YYYY-MM"));
  const [selectedPhase, setSelectedPhase] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProductionScope, setSelectedProductionScope] = useState("");
  const [dragOverAssignmentId, setDragOverAssignmentId] = useState<
    string | null
  >(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  // localData: map từ monthKey (hoặc monthKey_phaseId) -> DataItem[]
  const [localData, setLocalData] = useState<Map<string, DataItem[]>>(
    new Map(),
  );
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

  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data),
  });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

  const { data: apiResponse = [], isLoading } =
    useQuery<ContractSettlementResponse>({
      queryKey: [
        "contractsettlements",
        fromMonth,
        toMonth,
        selectedPhase,
        selectedProductionScope,
        selectedDepartment,
      ],
      queryFn: () =>
        SettlementService.getContractSettlements(
          fromMonth,
          toMonth,
          selectedPhase.map((p) => p._id).join(","),
          selectedProductionScope,
          selectedDepartment,
        ),
      enabled:
        !!fromMonth &&
        !!toMonth &&
        !!selectedProductionScope &&
        !!selectedDepartment,
    });

  // Chỉ cho phép kéo thả khi 1 tháng
  const hasPhase = selectedPhase.length > 0;
  const canDragDrop = fromMonth === toMonth;

  const { blockKeys, rowGroups } = useSettlementTableData(
    apiResponse as any,
    localData,
    hasPhase,
  );

  // Sync localData khi API response thay đổi
  useEffect(() => {
    if (!apiResponse?.length) return;
    const map = new Map<string, DataItem[]>();

    if (hasPhase) {
      (apiResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
        monthEntry.phases.forEach((phaseEntry) => {
          const key = `${monthEntry.month}_${phaseEntry.phaseId}`;
          map.set(key, phaseEntry.data);
        });
      });
    } else {
      (apiResponse as MonthlyDataNoPhase[]).forEach((monthEntry) => {
        map.set(monthEntry.month, monthEntry.data);
      });
    }

    setLocalData(map);
    setPendingChanges([]);
  }, [apiResponse]);

  const handleDrop = (
    mapKey: string,
    newAssignmentCodeId: string | null,
    fromAssignmentCodeId: string,
    payload: { materialCostId: string; materialItemId: string },
    newPrice: number | null,
  ) => {
    const targetKey = newAssignmentCodeId ?? "NO_ASSIGNMENTCODE";
    if (fromAssignmentCodeId === targetKey) return;

    setLocalData((prev) => {
      const newMap = new Map(prev);
      const groups = newMap.get(mapKey) ?? [];

      let draggedItem: any = null;
      const cleaned = groups.map((group) => {
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

      const updated = cleaned.map((group) => {
        const groupKey = group?.assignmentCode?._id ?? "NO_ASSIGNMENTCODE";
        if (groupKey === targetKey) {
          return {
            ...group,
            materialUseds: [...group.materialUseds, draggedItem],
          };
        }
        return group;
      });

      newMap.set(mapKey, updated);
      return newMap;
    });

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

  const handleDiscard = () => {
    const ids = new Set(pendingChanges.map((c) => c.materialItemId));
    // Reset về data gốc
    const map = new Map<string, DataItem[]>();
    if (hasPhase) {
      (apiResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
        monthEntry.phases.forEach((phaseEntry) => {
          map.set(`${monthEntry.month}_${phaseEntry.phaseId}`, phaseEntry.data);
        });
      });
    } else {
      (apiResponse as MonthlyDataNoPhase[]).forEach((monthEntry) => {
        map.set(monthEntry.month, monthEntry.data);
      });
    }
    setLocalData(map);
    setPendingChanges([]);
    setDiscardHighlight(ids);
    setTimeout(() => setDiscardHighlight(new Set()), 700);
  };

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
          fromMonth,
          toMonth,
          selectedPhase,
          selectedProductionScope,
          selectedDepartment,
        ],
      });
    },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const hasPending = pendingChanges.length > 0;
  const isShow =
    selectedPhase.length > 0 && selectedProductionScope && selectedDepartment;

  // helper
  const getBlockId = (month: string, phaseId?: string) => phaseId ? `${month}_${phaseId}` : month;

  return (
    <Paper sx={{ width: "calc(100vw - 148px)", p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Box display={"flex"} gap={2}>
          <Grid container spacing={2} mb={3} alignItems="center">
            <Grid item xs={3}>
              <FieldAutoCompleted
                data={departments?.data || []}
                value={selectedDepartment}
                setValue={setSelectedDepartment}
                title="Chọn phân xưởng"
                labelkey="name"
              />
            </Grid>
            <Grid item xs={3}>
              <FieldRangeMonthYear
                fromMonth={fromMonth}
                setFromMonth={setFromMonth}
                toMonth={toMonth}
                setToMonth={setToMonth}
              />
            </Grid>
            <Grid item xs={3}>
              <FieldAutoCompleted
                data={productionscopes?.data || []}
                value={selectedProductionScope}
                setValue={setSelectedProductionScope}
                title="Chọn diện sản xuất"
                labelkey="code"
              />
            </Grid>
            <Grid item xs={3}>
              <AppMultiAutocomplete
                options={phases?.data || []}
                value={selectedPhase}
                onChange={(val: any[]) => setSelectedPhase(val)}
                label="Chọn công đoạn"
                getOptionLabel={(option: any) => option.code}
              />
            </Grid>
          </Grid>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {hasPending && (
            <Box display="flex" gap={2} alignItems="center">
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
            </Box>
          )}
          {!canDragDrop && hasPending === false && selectedProductionScope && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              * Kéo thả chỉ khả dụng khi chọn 1 tháng duy nhất
            </Typography>
          )}
        </Box>
      </Box>
      
      {blockKeys.length > 0 && (
      <Box sx={{ overflowX: "auto", display: "flex", mb: 4 }}>
        <Table sx={{ tableLayout: "auto", width: "100%" }} size="small">
          <TableHead>
            {/* Row 1: Tiêu đề chính */}
            <TableRow>
              <TableCell align="center" colSpan={8} sx={{ border: "1px solid #ddd", p: 0.5 }} />
              {blockKeys.map((bk, idx) => (
                <TableCell
                  key={idx}
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
                  Quyết toán giao khoán tháng {dayjs(bk.month, "YYYY-MM").format("MM/YYYY")}
                </TableCell>
              ))}
            </TableRow>
            {/* Row 2: Phase codes */}
            <TableRow>
              <TableCell align="center" colSpan={8} sx={{ border: "1px solid #ddd", p: 0.5 }} />
              {blockKeys.map((bk, idx) => (
                <TableCell
                  key={idx}
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
                  {bk.phaseCode ?? bk.info.phases.map((i: any) => i?.code).join(", ")}
                </TableCell>
              ))}
            </TableRow>
            {/* Row 3: Production scope */}
            <TableRow>
              <TableCell align="center" colSpan={8} sx={{ border: "1px solid #ddd", p: 0.5 }} />
              {blockKeys.map((bk, idx) => (
                <TableCell
                  key={idx}
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
                  {(bk.info.productionScopes || []).map((i: any) => i?.code).join(", ")}
                </TableCell>
              ))}
            </TableRow>
            {/* Row 4: Kế hoạch / Thực hiện / So sánh */}
            <TableRow>
              <TableCell align="center" colSpan={8} sx={{ border: "1px solid #ddd", p: 0.5 }} />
              {blockKeys.map((bk, idx) => (
                <Fragment key={idx}>
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
                </Fragment>
              ))}
            </TableRow>
            {/* Row 5: Column headers */}
            <TableRow>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 42 }}>STT</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.8, minWidth: 117, whiteSpace: "normal", wordWrap: "break-word" }}>Mã vật tư, tài sản</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 60, whiteSpace: "normal", wordWrap: "break-word" }}>Trùng mã vật tư</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 60, whiteSpace: "normal", wordWrap: "break-word" }}>Mã thiết bị</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 55, whiteSpace: "normal", wordWrap: "break-word" }}>Mã giao khoán</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.8, minWidth: 143, whiteSpace: "normal", wordWrap: "break-word" }}>Tên vật tư, tài sản</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 43, whiteSpace: "normal", wordWrap: "break-word" }}>ĐVT</TableCell>
              <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5, minWidth: 64, whiteSpace: "normal", wordWrap: "break-word" }}>Đơn giá khoán</TableCell>
              
              {blockKeys.map((bk, idx) => (
                <Fragment key={idx}>
                  {isShow && <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 48, whiteSpace: "normal", wordWrap: "break-word" }}>Định mức gốc</TableCell>}
                  {isShow && <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 85, whiteSpace: "normal", wordWrap: "break-word" }}>Hệ số điều chỉnh định mức</TableCell>}
                  {isShow && <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 45, whiteSpace: "normal", wordWrap: "break-word" }}>Định mức</TableCell>}
                  <TableCell align="center" colSpan={3} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5 }}>Số lượng</TableCell>
                  <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 54 }}>Giá trị</TableCell>
                  <TableCell align="center" colSpan={3} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#4CAF503D", fontSize: "14px", p: 0.5 }}>Số lượng</TableCell>
                  <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#4CAF503D", fontSize: "14px", p: 0.5, minWidth: 54 }}>Giá trị</TableCell>
                  <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#FF620040", fontSize: "14px", p: 0.5, minWidth: 52 }}>Số lượng</TableCell>
                  <TableCell align="center" rowSpan={2} sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#FF620040", fontSize: "14px", p: 0.5, minWidth: 54 }}>Giá trị</TableCell>
                </Fragment>
              ))}
            </TableRow>
            <TableRow>
              {blockKeys.map((bk, idx) => (
                <Fragment key={idx}>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 48, whiteSpace: "normal", wordWrap: "break-word" }}>Tổng</TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 56, whiteSpace: "normal", wordWrap: "break-word" }}>Trong khoán</TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#F3D01640", fontSize: "14px", p: 0.5, minWidth: 57, whiteSpace: "normal", wordWrap: "break-word" }}>Ngoài khoán</TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#4CAF503D", fontSize: "14px", p: 0.5, minWidth: 48, whiteSpace: "normal", wordWrap: "break-word" }}>Tổng</TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#4CAF503D", fontSize: "14px", p: 0.5, minWidth: 55, whiteSpace: "normal", wordWrap: "break-word" }}>Trong khoán</TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", bgcolor: "#4CAF503D", fontSize: "14px", p: 0.5, minWidth: 55, whiteSpace: "normal", wordWrap: "break-word" }}>Ngoài khoán</TableCell>
                </Fragment>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Summary Rows */}
            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", p: 0.5 }}>1</TableCell>
              <TableCell colSpan={7} sx={{ border: "1px solid #ddd", p: 0.5 }}>Than nguyên khai</TableCell>
              {blockKeys.map((bk, idx) => {
                const info = bk.info;
                return Array.from({ length: isShow ? 13 : 10 }).map((_, i) => (
                  <TableCell
                    key={`${idx}_${i}`}
                    sx={{
                      border: "1px solid #ddd", p: 0.5,
                      bgcolor: i >= 0 && i <= (isShow ? 6 : 3) ? "#F3D01640" : i >= (isShow ? 7 : 4) && i <= (isShow ? 10 : 7) ? "#4CAF503D" : i >= (isShow ? 11 : 8) ? "#FF620040" : "white",
                    }}
                  >
                    {i === (isShow ? 4 : 1) ? formatDecimal(info.totalCoal) : ""}
                  </TableCell>
                ));
              })}
            </TableRow>
            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", p: 0.5 }}>2</TableCell>
              <TableCell colSpan={7} sx={{ border: "1px solid #ddd", p: 0.5 }}>Mét lò đào</TableCell>
              {blockKeys.map((bk, idx) => {
                const info = bk.info;
                return Array.from({ length: isShow ? 13 : 10 }).map((_, i) => (
                  <TableCell
                    key={`${idx}_${i}`}
                    sx={{
                      border: "1px solid #ddd", p: 0.5,
                      bgcolor: i >= 0 && i <= (isShow ? 6 : 3) ? "#F3D01640" : i >= (isShow ? 7 : 4) && i <= (isShow ? 10 : 7) ? "#4CAF503D" : i >= (isShow ? 11 : 8) ? "#FF620040" : "white",
                    }}
                  >
                    {i === (isShow ? 4 : 1) ? formatDecimal(info.totalExcavation) : ""}
                  </TableCell>
                ));
              })}
            </TableRow>
            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", p: 0.5 }}>3</TableCell>
              <TableCell colSpan={7} sx={{ border: "1px solid #ddd", p: 0.5 }}>Mét lò xén</TableCell>
              {blockKeys.map((bk, idx) => {
                const info = bk.info;
                return Array.from({ length: isShow ? 13 : 10 }).map((_, i) => (
                  <TableCell
                    key={`${idx}_${i}`}
                    sx={{
                      border: "1px solid #ddd", p: 0.5,
                      bgcolor: i >= 0 && i <= (isShow ? 6 : 3) ? "#F3D01640" : i >= (isShow ? 7 : 4) && i <= (isShow ? 10 : 7) ? "#4CAF503D" : i >= (isShow ? 11 : 8) ? "#FF620040" : "white",
                    }}
                  >
                    {i === (isShow ? 4 : 1) ? formatDecimal(info.totalCutting) : ""}
                  </TableCell>
                ));
              })}
            </TableRow>
            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", p: 0.5 }}>4</TableCell>
              <TableCell colSpan={7} sx={{ border: "1px solid #ddd", p: 0.5 }}>Tỉ lệ đá lẫn trong gương (Ckep)</TableCell>
              {blockKeys.map((bk, idx) => {
                const info = bk.info;
                return Array.from({ length: isShow ? 13 : 10 }).map((_, i) => (
                  <TableCell
                    key={`${idx}_${i}`}
                    sx={{
                      border: "1px solid #ddd", p: 0.5,
                      bgcolor: i >= 0 && i <= (isShow ? 6 : 3) ? "#F3D01640" : i >= (isShow ? 7 : 4) && i <= (isShow ? 10 : 7) ? "#4CAF503D" : i >= (isShow ? 11 : 8) ? "#FF620040" : "white",
                    }}
                  >
                    {i === (isShow ? 4 : 1) ? info.rockRatio : ""}
                  </TableCell>
                ));
              })}
            </TableRow>
            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", p: 0.5 }}>5</TableCell>
              <TableCell colSpan={7} sx={{ border: "1px solid #ddd", p: 0.5 }}>Vật tư có định mức</TableCell>
              {blockKeys.map((bk, idx) => (
                Array.from({ length: isShow ? 13 : 10 }).map((_, i) => (
                  <TableCell
                    key={`${idx}_${i}`}
                    sx={{
                      border: "1px solid #ddd", p: 0.5,
                      bgcolor: i >= 0 && i <= (isShow ? 6 : 3) ? "#F3D01640" : i >= (isShow ? 7 : 4) && i <= (isShow ? 10 : 7) ? "#4CAF503D" : i >= (isShow ? 11 : 8) ? "#FF620040" : "white",
                    }}
                  />
                ))
              ))}
            </TableRow>

            {/* Data Rows */}
            {rowGroups.map((rowGroup, groupIndex) => {
              const assignment = rowGroup;
              
              return (
                <Fragment key={assignment.compoundKey}>
                  <TableRow
                    onDragOver={
                      canDragDrop
                        ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverAssignmentId(
                              assignment.assignmentCode?._id ?? "NO_ASSIGNMENTCODE",
                            );
                          }
                        : undefined
                    }
                    onDragLeave={
                      canDragDrop
                        ? (e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node))
                              setDragOverAssignmentId(null);
                          }
                        : undefined
                    }
                    onDrop={
                      canDragDrop
                        ? (e) => {
                            e.preventDefault();
                            setDragOverAssignmentId(null);
                            try {
                              const payload = JSON.parse(e.dataTransfer.getData("application/json"));
                              // Lấy mapKey đầu tiên vì canDragDrop = true nghĩa là chỉ có 1 tháng (1 block)
                              const mapKey = blockKeys.length > 0 ? getBlockId(blockKeys[0].month, blockKeys[0].phaseId) : "";
                              if (mapKey) {
                                handleDrop(
                                  mapKey,
                                  assignment.assignmentCode?._id ?? null,
                                  payload.fromAssignmentCodeId,
                                  {
                                    materialCostId: payload.materialCostId,
                                    materialItemId: payload.materialItemId,
                                  },
                                  assignment.price ?? null,
                                );
                              }
                            } catch {}
                          }
                        : undefined
                    }
                    sx={{
                      outline: dragOverAssignmentId === (assignment.assignmentCode?._id ?? "NO_ASSIGNMENTCODE") ? "2px dashed #1976d2" : "none",
                      outlineOffset: "-2px",
                      bgcolor: dragOverAssignmentId === (assignment.assignmentCode?._id ?? "NO_ASSIGNMENTCODE") ? "#e3f2fd" : "inherit",
                      transition: "background-color 0.15s, outline 0.15s",
                    }}
                  >
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5 }}>{groupIndex + 6}</TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5 }}></TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", color: "black", fontSize: "14px", p: 0.5 }}></TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", color: "black", fontSize: "14px", p: 0.5 }}>
                      {assignment.assignmentCode?.deviceCode?.code}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5 }}>
                      {assignment.assignmentCode?.code}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #ddd", fontWeight: "bold", fontSize: "14px", p: 0.5 }}>
                      {assignment.assignmentCode ? assignment.assignmentCode.name : "Vật tư không có định mức"}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5 }}>
                      {assignment.assignmentCode?.uom?.name}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5 }}>
                      {assignment.assignmentCode ? formattedPrice(assignment.price) : ""}
                    </TableCell>

                    {/* Mapped dynamic columns for Assignment */}
                    {blockKeys.map((bk, idx) => {
                      const blockId = getBlockId(bk.month, bk.phaseId);
                      const blockData = assignment.blocks.get(blockId)?.groupData;
                      
                      return (
                        <Fragment key={`asg_${idx}`}>
                          {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}>{assignment.assignmentCode && blockData ? formatDecimal(Number(blockData.baseNorm)) : ""}</TableCell>}
                          {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}>{assignment.assignmentCode && blockData ? formatDecimal(Number(blockData.adjustmentNorm)) : ""}</TableCell>}
                          {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}>{assignment.assignmentCode && blockData ? formatDecimal(Number(blockData.norm)) : ""}</TableCell>}
                          
                          {Array.from({ length: 10 }).map((_, i) => (
                            <TableCell
                              key={`asg_cell_${i}`}
                              align="center"
                              sx={{
                                border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5,
                                bgcolor: i >= 0 && i <= 3 ? "#F3D01640" : i >= 4 && i <= 7 ? "#4CAF503D" : i >= 8 && i <= 9 ? "#FF620040" : "white",
                              }}
                            >
                              {i === 0 ? (assignment.assignmentCode && blockData ? formatDecimal(blockData.plan_Quantity) : "") :
                               i === 1 ? "" :
                               i === 2 ? "" :
                               i === 3 ? (assignment.assignmentCode && blockData ? formattedPrice(blockData.plan_Cost) : "") :
                               i === 4 ? (assignment.assignmentCode && blockData ? formatDecimal(blockData.used_Quantity) : "") :
                               i === 5 ? "" :
                               i === 6 ? "" :
                               i === 7 ? (assignment.assignmentCode && blockData ? formattedPrice(blockData.used_Cost) : "") :
                               i === 8 ? (assignment.assignmentCode && blockData ? formatDecimal(blockData.varianceQuantity) : "") :
                               i === 9 ? (assignment.assignmentCode && blockData ? formattedPrice(blockData.varianceCost) : "") :
                               ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    })}
                  </TableRow>

                  {/* Mapped Material Rows */}
                  {Array.from({ length: assignment.maxRows }).map((_, i) => {
                    const materialMeta = assignment.alignedMaterialsMeta[i];
                    if (!materialMeta) return null; // Nên có do maxRows == length
                    
                    const materialUsedRef = materialMeta; // Lấy thông tin cố định từ đây
                    const isDuplicate = assignment.alignedMaterialsMeta.filter(m => m?.material?._id === materialUsedRef.material?._id).length > 1;

                    return (
                      <TableRow
                        key={`mat_${assignment.compoundKey}_${i}`}
                        draggable={canDragDrop}
                        onDragStart={
                          canDragDrop
                            ? (e) => {
                                setDraggingItemId(materialUsedRef.materialItemId);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    materialCostId: materialUsedRef.materialCostId,
                                    materialItemId: materialUsedRef.materialItemId,
                                    fromAssignmentCodeId: assignment.assignmentCode?._id ?? "NO_ASSIGNMENTCODE",
                                  }),
                                );
                              }
                            : undefined
                        }
                        onDragEnd={canDragDrop ? () => setDraggingItemId(null) : undefined}
                        sx={{
                          opacity: draggingItemId === materialUsedRef.materialItemId ? 0.4 : 1,
                          cursor: canDragDrop ? "grab" : "default",
                          "&:active": { cursor: canDragDrop ? "grabbing" : "default" },
                          transition: "opacity 0.15s, background-color 0.7s ease",
                          "&:hover": { bgcolor: "#f5f5f5" },
                          bgcolor: discardHighlight.has(materialUsedRef.materialItemId) ? "#fff3cd" : isDuplicate ? "#ffebee" : "transparent",
                        }}
                      >
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontSize: "14px", p: 0.5 }}></TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontSize: "14px", p: 0.5 }}>{materialUsedRef.material?.code}</TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", color: "black", fontSize: "14px", p: 0.5 }}>
                          {isDuplicate ? assignment.alignedMaterialsMeta.filter(m => m?.material?._id === materialUsedRef.material?._id).length : ""}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", color: "black", fontSize: "14px", p: 0.5 }}></TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold", color: "black", fontSize: "14px", p: 0.5 }}></TableCell>
                        <TableCell sx={{ border: "1px solid #ddd", fontSize: "14px", p: 0.5 }}>{materialUsedRef.material?.name}</TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontSize: "14px", p: 0.5 }}>{materialUsedRef.material?.uom?.name}</TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5 }}>
                          {assignment.assignmentCode ? "" : formattedPrice(materialUsedRef.price)}
                        </TableCell>

                        {/* Mapped dynamic columns for Material */}
                        {blockKeys.map((bk, idx) => {
                          const blockId = getBlockId(bk.month, bk.phaseId);
                          const mu = assignment.blocks.get(blockId)?.materialUseds?.[i];
                          
                          return (
                            <Fragment key={`mat_cell_${idx}`}>
                              {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}></TableCell>}
                              {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}></TableCell>}
                              {isShow && <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5, bgcolor: "#F3D01640" }}></TableCell>}
                              
                              {Array.from({ length: 10 }).map((_, colIdx) => (
                                <TableCell
                                  key={`mat_col_${colIdx}`}
                                  align="center"
                                  sx={{
                                    border: "1px solid #ddd", fontWeight: "normal", fontSize: "14px", p: 0.5,
                                    bgcolor: colIdx >= 0 && colIdx <= 3 ? "#F3D01640" : colIdx >= 4 && colIdx <= 7 ? "#4CAF503D" : colIdx >= 8 && colIdx <= 9 ? "#FF620040" : "white",
                                  }}
                                >
                                  {colIdx === 0 ? (!assignment.assignmentCode && mu ? formatDecimal(mu.quantity) : "") :
                                   colIdx === 1 ? "" :
                                   colIdx === 2 ? "" :
                                   colIdx === 3 ? (!assignment.assignmentCode && mu ? formattedPrice(mu.cost) : "") :
                                   colIdx === 4 ? (mu ? formatDecimal(mu.quantity) : "") :
                                   colIdx === 5 ? "" :
                                   colIdx === 6 ? "" :
                                   colIdx === 7 ? (assignment.assignmentCode ? "" : (mu ? formattedPrice(mu.cost) : "")) :
                                   colIdx === 8 ? (!assignment.assignmentCode && mu ? formatDecimal(0) : "") :
                                   colIdx === 9 ? (!assignment.assignmentCode && mu ? formattedPrice(0) : "") :
                                   ""}
                                </TableCell>
                              ))}
                            </Fragment>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </Fragment>
              );
            })}
            
            {/* Summary Row at the Bottom */}
            {rowGroups.length > 0 && (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={8}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                    fontSize: "14px",
                    p: 0.5,
                    bgcolor: "#f5f5f5",
                  }}
                >
                  Tổng chi phí
                </TableCell>
                {blockKeys.map((bk, idx) => {
                  const blockId = getBlockId(bk.month, bk.phaseId);
                  let totalPlan = 0;
                  let totalUsed = 0;

                  rowGroups.forEach((rg) => {
                    const bd = rg.blocks.get(blockId)?.groupData;
                    if (rg.assignmentCode && bd) {
                      totalPlan += Number(bd.plan_Cost || 0);
                      totalUsed += Number(bd.used_Cost || 0);
                    } else if (!rg.assignmentCode) {
                      const mus = rg.blocks.get(blockId)?.materialUseds;
                      if (mus) {
                        mus.forEach(mu => {
                          if (mu) {
                            totalPlan += Number(mu.cost || 0);
                            totalUsed += Number(mu.cost || 0);
                          }
                        });
                      }
                    }
                  });

                  const totalVariance = totalPlan - totalUsed;

                  return (
                    <Fragment key={`total_block_${idx}`}>
                      {isShow && (
                        <>
                          <TableCell sx={{ border: "1px solid #ddd", bgcolor: "#F3D01640" }}></TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", bgcolor: "#F3D01640" }}></TableCell>
                          <TableCell sx={{ border: "1px solid #ddd", bgcolor: "#F3D01640" }}></TableCell>
                        </>
                      )}
                      {Array.from({ length: 10 }).map((_, colIdx) => (
                        <TableCell
                          key={`total_col_${colIdx}`}
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor:
                              colIdx >= 0 && colIdx <= 3
                                ? "#F3D01640"
                                : colIdx >= 4 && colIdx <= 7
                                ? "#4CAF503D"
                                : colIdx >= 8 && colIdx <= 9
                                ? "#FF620040"
                                : "white",
                          }}
                        >
                          {colIdx === 3 ? formattedPrice(totalPlan) :
                           colIdx === 7 ? formattedPrice(totalUsed) :
                           colIdx === 9 ? formattedPrice(totalVariance) : ""}
                        </TableCell>
                      ))}
                    </Fragment>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      )}
    </Paper>
  );
}
