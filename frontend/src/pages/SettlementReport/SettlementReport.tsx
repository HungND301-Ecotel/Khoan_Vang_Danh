import React, { Fragment, useEffect, useState, useMemo, useRef } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";

import { Edit, Save, Undo } from "@mui/icons-material";
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
  MonthlyDataAllScopes,
} from "../../types";
import {
  useSettlementTableData,
  BlockKey,
  RowGroup,
} from "../../hooks/useSettlementTableData";

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
      materialId: string | null; // 👈 thêm
      department: string; // 👈 thêm
      month: string;
      newAssignmentCodeId: string | null;
      newPrice: number | null;
    }>
  >([]);
  const [discardHighlight, setDiscardHighlight] = useState<Set<string>>(
    new Set(),
  );

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState<number>(0);

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
      enabled: !!fromMonth && !!toMonth && !!selectedDepartment,
    });

  // Chỉ cho phép kéo thả khi 1 tháng
  const hasPhase = selectedPhase.length > 0;
  const canDragDrop = fromMonth === toMonth && !selectedProductionScope && !hasPhase;

  const isAllScopesMode = !selectedProductionScope;
  const effectiveHasPhase = hasPhase || isAllScopesMode;

  const transformedResponse = useMemo(() => {
    if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0)
      return [];
    if (isAllScopesMode) {
      return (apiResponse as MonthlyDataAllScopes[]).map((monthEntry) => {
        const phases: any[] = [];
        (monthEntry.scopeGroups || []).forEach((scopeGroup) => {
          (scopeGroup.phases || []).forEach((phaseEntry) => {
            phases.push({
              phaseId: `${scopeGroup.scopeId}_${phaseEntry.phaseId}`,
              phaseCode: phaseEntry.phaseCode,
              scopeCode: scopeGroup.scopeCode,
              phaseName: phaseEntry.phaseName,
              info: phaseEntry.info,
              data: phaseEntry.data,
              isOther: false,
            });
          });
        });
        if (monthEntry.otherTasks) {
          let totalCoal = 0;
          let totalExcavation = 0;
          let totalCutting = 0;

          // if (Array.isArray(monthEntry.otherTasks.phases)) {
          //   monthEntry.otherTasks.phases.forEach((p: any) => {
          //     const unit = (p.unit || "").toLowerCase().trim();
          //     const phaseName = (p.phase?.name || "").toLowerCase();
          //     const phaseGroupName = (
          //       p.phase?.phaseGroup?.name || ""
          //     ).toLowerCase();
          //     const prod = p.production || 0;

          //     if (unit === "tấn" || unit === "t" || unit === "tan") {
          //       totalCoal += prod;
          //     } else if (unit === "mét" || unit === "m" || unit === "met") {
          //       if (
          //         phaseName.includes("xén") ||
          //         phaseGroupName.includes("xén")
          //       ) {
          //         totalCutting += prod;
          //       } else {
          //         totalExcavation += prod;
          //       }
          //     }
          //   });
          // }

          phases.push({
            phaseId: `OTHER_${monthEntry.month}`,
            phaseCode: "Công việc khác",
            scopeCode: "",
            phaseName: "Công việc khác",
            info: {
              totalCoal,
              totalExcavation,
              totalCutting,
              rockRatio: null,
            },
            data: monthEntry.otherTasks.data,
            isOther: true,
          });
        }
        return {
          month: monthEntry.month,
          phases,
        };
      });
    }
    return apiResponse;
  }, [apiResponse, isAllScopesMode]);

  const showSummary =
    !!selectedDepartment &&
    !!toMonth &&
    !!fromMonth &&
    !selectedProductionScope &&
    selectedPhase.length === 0;

  const { blockKeys, rowGroups } = useSettlementTableData(
    transformedResponse as any,
    localData,
    effectiveHasPhase,
    showSummary,
  );

  useEffect(() => {
    if (!tableRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTableWidth(entry.contentRect.width);
      }
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, [blockKeys, rowGroups]); // re-run if data/columns change

  const handleTopScroll = () => {
    if (tableContainerRef.current && topScrollRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (tableContainerRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  // Sync localData khi API response thay đổi
  useEffect(() => {
    if (!transformedResponse?.length) return;
    const map = new Map<string, DataItem[]>();

    if (effectiveHasPhase) {
      (transformedResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
        (monthEntry.phases || []).forEach((phaseEntry) => {
          const key = `${monthEntry.month}_${phaseEntry.phaseId}`;
          map.set(key, phaseEntry.data);
        });
      });
    } else {
      (transformedResponse as MonthlyDataNoPhase[]).forEach((monthEntry) => {
        map.set(monthEntry.month, monthEntry.data);
      });
    }

    setLocalData(map);
    setPendingChanges([]);
  }, [transformedResponse, effectiveHasPhase]);

  const showNorms = (bk: any) => {
    return isShow && !bk.isOther;
  };

  // Tính trùng mã vật tư xuyên suốt toàn bộ rowGroups
  const allMaterialIds = useMemo(() => {
    const ids: string[] = [];
    rowGroups.forEach((rg) => {
      rg.alignedMaterialsMeta.forEach((m: any) => {
        if (m?.material?._id) ids.push(m.material._id);
      });
    });
    return ids;
  }, [rowGroups]);

  const handleDrop = (
    targetCompoundKey: string,
    fromCompoundKey: string,
    payload: { materialId?: string },
    targetAssignmentCode: any | null,
    newPrice: number | null,
  ) => {
    if (fromCompoundKey === targetCompoundKey) return;

    setLocalData((prev) => {
      const newMap = new Map(prev);

      // Áp dụng cho MỌI block (mọi phase) đang có mặt trong bảng,
      // không còn cố định vào blockKeys[0] nữa
      blockKeys.forEach((bk) => {
        if (bk.isSummary) return;
        const mapKey = getBlockId(bk.month, bk.phaseId);
        const groups = newMap.get(mapKey);
        if (!groups) return;

        let draggedItem: any = null;
        const cleaned = groups.map((group) => {
          const foundItems = group.materialUseds.filter(
            (m: any) => m.material?._id === payload.materialId,
          );
          if (foundItems.length) draggedItem = foundItems;

          return {
            ...group,
            materialUseds: group.materialUseds.filter(
              (m: any) => m.material?._id !== payload.materialId,
            ),
          };
        });

        // Block này không chứa vật tư đang kéo -> bỏ qua, không đụng vào
        if (!draggedItem) return;

        let matched = false;
        const updated = cleaned.map((group) => {
          const groupKey = group?.assignmentCode
            ? `${group.assignmentCode.code}_${group.price}`
            : `NO_ASSIGNMENTCODE`;
          if (groupKey === targetCompoundKey) {
            matched = true;
            return {
              ...group,
              materialUseds: [...group.materialUseds, ...draggedItem],
            };
          }
          return group;
        });

        if (!matched) {
          updated.push({
            assignmentCode: targetAssignmentCode,
            price: newPrice,
            materialUseds: [...draggedItem],
          } as any);
        }

        newMap.set(mapKey, updated);
      });

      return newMap;
    });

    setPendingChanges((prev) => [
      ...prev.filter((c) => c.materialId !== payload.materialId),
      {
        materialId: payload.materialId ?? null,
        department: selectedDepartment,
        month: fromMonth,
        newAssignmentCodeId: targetAssignmentCode?._id ?? null,
        newPrice,
      },
    ]);
  };

  const buildLocalData = () => {
    const map = new Map<string, DataItem[]>();

    if (effectiveHasPhase) {
      (transformedResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
        (monthEntry.phases ?? []).forEach((phase) => {
          map.set(`${monthEntry.month}_${phase.phaseId}`, phase.data ?? []);
        });
      });
    } else {
      (transformedResponse as MonthlyDataNoPhase[]).forEach((monthEntry) => {
        map.set(monthEntry.month, monthEntry.data ?? []);
      });
    }

    return map;
  };
  useEffect(() => {
    setLocalData(buildLocalData());
    setPendingChanges([]);
  }, [transformedResponse, effectiveHasPhase]);

  const handleDiscard = () => {
    const ids = new Set(
      pendingChanges.map((c) => c.materialId).filter(Boolean) as string[],
    );

    setLocalData(buildLocalData());
    setPendingChanges([]);

    setDiscardHighlight(ids);
    setTimeout(() => setDiscardHighlight(new Set()), 700);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        pendingChanges.map((change) =>
          api.patch("/contractsettlements/updateMaterialAssignmentCode", {
            materialId: change.materialId,
            department: change.department,
            month: change.month,
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

  const [editingMaterial, setEditingMaterial] = useState<{
    materialCostId: string;
    materialItemId: string;
    materialName: string;
    currentQuantity: number;
  } | null>(null);
  const [editQuantityInput, setEditQuantityInput] = useState<string>("");

  const updateQuantityMutation = useMutation({
    mutationFn: async () => {
      if (!editingMaterial) return;
      await api.patch("/contractsettlements/updateMaterialQuantity", {
        materialCostId: editingMaterial.materialCostId,
        materialItemId: editingMaterial.materialItemId,
        newQuantity: Number(editQuantityInput),
      });
    },
    onSuccess: () => {
      setEditingMaterial(null);
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

  const handleOpenEditQuantity = (materialUsedRef: any) => {
    setEditingMaterial({
      materialCostId: materialUsedRef.materialCostId,
      materialItemId: materialUsedRef.materialItemId,
      materialName: materialUsedRef.material?.name || "",
      currentQuantity: materialUsedRef.quantity || 0,
    });
    setEditQuantityInput(String(materialUsedRef.quantity || 0));
  };

  const hasPending = pendingChanges.length > 0;
  // Hiện 3 cột định mức khi data đã tách công đoạn (bao gồm cả khi không chọn diện)
  const isShow = effectiveHasPhase;

  // helper
  const getBlockId = (month: string, phaseId?: string) =>
    phaseId ? `${month}_${phaseId}` : month;

  const theadRef = useRef<HTMLTableSectionElement>(null);

  // JS-based sticky header for window scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        !theadRef.current ||
        !tableContainerRef.current ||
        !topScrollRef.current
      )
        return;

      const containerRect = tableContainerRef.current.getBoundingClientRect();
      const topScrollRect = topScrollRef.current.getBoundingClientRect();

      const stickPosition = topScrollRect.bottom;

      if (
        containerRect.top < stickPosition &&
        containerRect.bottom > stickPosition
      ) {
        let y = stickPosition - containerRect.top;
        const maxTranslate =
          containerRect.height - theadRef.current.offsetHeight;
        y = Math.min(y, maxTranslate);

        theadRef.current.style.transform = `translateY(${y}px)`;
      } else {
        theadRef.current.style.transform = `translateY(0)`;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    handleScroll();

    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [blockKeys]);

  return (
    <Paper
      sx={{
        width: "calc(100vw - 154px)",
        p: 2,
      }}
    >
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
                disabled={!selectedProductionScope}
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
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            * Kéo thả, chỉnh sửa chỉ khả dụng khi chọn 1 tháng
          </Typography>
        </Box>
      </Box>

      {blockKeys.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mb: 4,
            border: "1px solid #ddd",
          }}
        >
          {/* Top scrollbar container */}
          <Box
            ref={topScrollRef}
            onScroll={handleTopScroll}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              position: "sticky",
              top: 100,
              zIndex: 11,
              bgcolor: "white",
              borderBottom: "1px solid #ddd",
            }}
          >
            <Box sx={{ width: tableWidth, height: "1px" }} />
          </Box>

          {/* Table container */}
          <Box
            ref={tableContainerRef}
            onScroll={handleTableScroll}
            sx={{
              overflowX: "auto",
              // overflowY: "auto",
              // maxHeight: "calc(100vh - 250px)",
              display: "flex",
            }}
          >
            <Table
              ref={tableRef}
              sx={{
                tableLayout: "auto",
                width: "100%",
              }}
              size="small"
            >
              <TableHead
                ref={theadRef}
                sx={{
                  zIndex: 10,
                  bgcolor: "white",
                  position: "relative",
                  transition: "transform 0.1s ease-out",
                }}
              >
                {/* Row 1: Tiêu đề chính */}
                <TableRow>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 42,
                      bgcolor: "white",
                    }}
                  >
                    STT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.8,
                      minWidth: 117,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Mã vật tư, tài sản
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 60,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Trùng mã vật tư
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 60,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Mã thiết bị
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 55,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Mã giao khoán
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.8,
                      minWidth: 143,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Tên vật tư, tài sản
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 43,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    ĐVT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={6}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                      minWidth: 64,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      bgcolor: "white",
                    }}
                  >
                    Đơn giá khoán
                  </TableCell>
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={bk.isSummary ? 6 : showNorms(bk) ? 13 : 10}
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                        bgcolor: bk.isSummary ? "#e0e0e0" : "#F3D01640",
                        fontSize: "0.75rem",
                        p: 0.5,
                      }}
                    >
                      Quyết toán giao khoán tháng{" "}
                      {dayjs(bk.month, "YYYY-MM").format("MM/YYYY")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Row 2: Phase codes */}
                <TableRow>
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={bk.isSummary ? 6 : showNorms(bk) ? 13 : 10}
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                        bgcolor: bk.isSummary ? "#e0e0e0" : "#F3D01640",
                        fontSize: "0.75rem",
                        p: 0.5,
                      }}
                    >
                      {bk.phaseCode ??
                        bk.info.phases.map((i: any) => i?.code).join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Row 3: Production scope */}
                <TableRow>
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={bk.isSummary ? 6 : showNorms(bk) ? 13 : 10}
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                        bgcolor: bk.isSummary ? "#e0e0e0" : "#F3D01640",
                        fontSize: "0.75rem",
                        p: 0.5,
                      }}
                    >
                      {bk.isSummary
                        ? ""
                        : bk.isOther
                          ? "Công việc"
                          : (bk.info.productionScopes || [])
                              .map((i: any) => i?.code)
                              .join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Row 4: Kế hoạch / Thực hiện / So sánh */}
                <TableRow>
                  {blockKeys.map((bk, idx) => (
                    <Fragment key={idx}>
                      <TableCell
                        align="center"
                        colSpan={bk.isSummary ? 2 : showNorms(bk) ? 7 : 4}
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
                        colSpan={bk.isSummary ? 2 : 4}
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
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      return (
                        <Fragment key={idx}>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                              bgcolor: "#F3D01640",
                              fontSize: "14px",
                              p: 0.5,
                              minWidth: 60,
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
                              minWidth: 60,
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
                              bgcolor: "#4CAF503D",
                              fontSize: "14px",
                              p: 0.5,
                              minWidth: 60,
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
                              minWidth: 60,
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
                              minWidth: 60,
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
                              minWidth: 60,
                            }}
                          >
                            Giá trị
                          </TableCell>
                        </Fragment>
                      );
                    }
                    return (
                      <Fragment key={idx}>
                        {showNorms(bk) && (
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
                        {showNorms(bk) && (
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
                        {showNorms(bk) && (
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
                      </Fragment>
                    );
                  })}
                </TableRow>
                <TableRow>
                  {blockKeys
                    .filter((bk) => !bk.isSummary)
                    .map((bk, idx) => (
                      <Fragment key={idx}>
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
                      </Fragment>
                    ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Summary Rows */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      p: 0.5,
                    }}
                  >
                    1
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ border: "1px solid #ddd", p: 0.5 }}
                  >
                    Than nguyên khai
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      const sumCoal = blockKeys
                        .filter((b) => b.month === bk.month && !b.isSummary)
                        .reduce((sum, b) => sum + (b.info?.totalCoal || 0), 0);

                      return (
                        <Fragment key={idx}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableCell
                              key={`${idx}_summary_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= 1
                                    ? "#F3D01640"
                                    : i >= 2 && i <= 3
                                      ? "#4CAF503D"
                                      : i >= 4
                                        ? "#FF620040"
                                        : "white",
                              }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumCoal) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }

                    const info = bk.info;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: showNorms(bk) ? 13 : 10 }).map(
                          (_, i) => (
                            <TableCell
                              key={`${idx}_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= (showNorms(bk) ? 6 : 3)
                                    ? "#F3D01640"
                                    : i >= (showNorms(bk) ? 7 : 4) &&
                                        i <= (showNorms(bk) ? 10 : 7)
                                      ? "#4CAF503D"
                                      : i >= (showNorms(bk) ? 11 : 8)
                                        ? "#FF620040"
                                        : "white",
                              }}
                            >
                              {i === (showNorms(bk) ? 4 : 1)
                                ? formatDecimal(info.totalCoal)
                                : ""}
                            </TableCell>
                          ),
                        )}
                      </Fragment>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      p: 0.5,
                    }}
                  >
                    2
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ border: "1px solid #ddd", p: 0.5 }}
                  >
                    Mét lò đào
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      const sumExcavation = blockKeys
                        .filter((b) => b.month === bk.month && !b.isSummary)
                        .reduce(
                          (sum, b) => sum + (b.info?.totalExcavation || 0),
                          0,
                        );

                      return (
                        <Fragment key={idx}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableCell
                              key={`${idx}_summary_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= 1
                                    ? "#F3D01640"
                                    : i >= 2 && i <= 3
                                      ? "#4CAF503D"
                                      : i >= 4
                                        ? "#FF620040"
                                        : "white",
                              }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumExcavation) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }

                    const info = bk.info;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: showNorms(bk) ? 13 : 10 }).map(
                          (_, i) => (
                            <TableCell
                              key={`${idx}_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= (showNorms(bk) ? 6 : 3)
                                    ? "#F3D01640"
                                    : i >= (showNorms(bk) ? 7 : 4) &&
                                        i <= (showNorms(bk) ? 10 : 7)
                                      ? "#4CAF503D"
                                      : i >= (showNorms(bk) ? 11 : 8)
                                        ? "#FF620040"
                                        : "white",
                              }}
                            >
                              {i === (showNorms(bk) ? 4 : 1)
                                ? formatDecimal(info.totalExcavation)
                                : ""}
                            </TableCell>
                          ),
                        )}
                      </Fragment>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      p: 0.5,
                    }}
                  >
                    3
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ border: "1px solid #ddd", p: 0.5 }}
                  >
                    Mét lò xén
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      const sumCutting = blockKeys
                        .filter((b) => b.month === bk.month && !b.isSummary)
                        .reduce(
                          (sum, b) => sum + (b.info?.totalCutting || 0),
                          0,
                        );

                      return (
                        <Fragment key={idx}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableCell
                              key={`${idx}_summary_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= 1
                                    ? "#F3D01640"
                                    : i >= 2 && i <= 3
                                      ? "#4CAF503D"
                                      : i >= 4
                                        ? "#FF620040"
                                        : "white",
                              }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumCutting) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }

                    const info = bk.info;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: showNorms(bk) ? 13 : 10 }).map(
                          (_, i) => (
                            <TableCell
                              key={`${idx}_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= (showNorms(bk) ? 6 : 3)
                                    ? "#F3D01640"
                                    : i >= (showNorms(bk) ? 7 : 4) &&
                                        i <= (showNorms(bk) ? 10 : 7)
                                      ? "#4CAF503D"
                                      : i >= (showNorms(bk) ? 11 : 8)
                                        ? "#FF620040"
                                        : "white",
                              }}
                            >
                              {i === (showNorms(bk) ? 4 : 1)
                                ? formatDecimal(info.totalCutting)
                                : ""}
                            </TableCell>
                          ),
                        )}
                      </Fragment>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      p: 0.5,
                    }}
                  >
                    4
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ border: "1px solid #ddd", p: 0.5 }}
                  >
                    Tỉ lệ đá lẫn trong gương (Ckep)
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      return (
                        <Fragment key={idx}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableCell
                              key={`${idx}_summary_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= 1
                                    ? "#F3D01640"
                                    : i >= 2 && i <= 3
                                      ? "#4CAF503D"
                                      : i >= 4
                                        ? "#FF620040"
                                        : "white",
                              }}
                            />
                          ))}
                        </Fragment>
                      );
                    }

                    const info = bk.info;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: showNorms(bk) ? 13 : 10 }).map(
                          (_, i) => (
                            <TableCell
                              key={`${idx}_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= (showNorms(bk) ? 6 : 3)
                                    ? "#F3D01640"
                                    : i >= (showNorms(bk) ? 7 : 4) &&
                                        i <= (showNorms(bk) ? 10 : 7)
                                      ? "#4CAF503D"
                                      : i >= (showNorms(bk) ? 11 : 8)
                                        ? "#FF620040"
                                        : "white",
                              }}
                            >
                              {i === (showNorms(bk) ? 4 : 1)
                                ? bk.isOther
                                  ? ""
                                  : info.rockRatio
                                : ""}
                            </TableCell>
                          ),
                        )}
                      </Fragment>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      p: 0.5,
                    }}
                  >
                    5
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ border: "1px solid #ddd", p: 0.5 }}
                  >
                    Vật tư có định mức
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) {
                      return (
                        <Fragment key={idx}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableCell
                              key={`${idx}_summary_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= 1
                                    ? "#F3D01640"
                                    : i >= 2 && i <= 3
                                      ? "#4CAF503D"
                                      : i >= 4
                                        ? "#FF620040"
                                        : "white",
                              }}
                            />
                          ))}
                        </Fragment>
                      );
                    }
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: showNorms(bk) ? 13 : 10 }).map(
                          (_, i) => (
                            <TableCell
                              key={`${idx}_${i}`}
                              sx={{
                                border: "1px solid #ddd",
                                p: 0.5,
                                bgcolor:
                                  i >= 0 && i <= (showNorms(bk) ? 6 : 3)
                                    ? "#F3D01640"
                                    : i >= (showNorms(bk) ? 7 : 4) &&
                                        i <= (showNorms(bk) ? 10 : 7)
                                      ? "#4CAF503D"
                                      : i >= (showNorms(bk) ? 11 : 8)
                                        ? "#FF620040"
                                        : "white",
                              }}
                            />
                          ),
                        )}
                      </Fragment>
                    );
                  })}
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
                                  assignment.assignmentCode?._id ??
                                    "NO_ASSIGNMENTCODE",
                                );
                              }
                            : undefined
                        }
                        onDragLeave={
                          canDragDrop
                            ? (e) => {
                                if (
                                  !e.currentTarget.contains(
                                    e.relatedTarget as Node,
                                  )
                                )
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
                                  const payload = JSON.parse(
                                    e.dataTransfer.getData("application/json"),
                                  );
                                  handleDrop(
                                    assignment.compoundKey,
                                    payload.fromCompoundKey,
                                    { materialId: payload.materialId },
                                    assignment.assignmentCode ?? null,
                                    assignment.assignmentCode
                                      ? assignment.price
                                      : null,
                                  );
                                } catch {}
                              }
                            : undefined
                        }
                        sx={{
                          outline:
                            dragOverAssignmentId ===
                            (assignment.assignmentCode?._id ??
                              "NO_ASSIGNMENTCODE")
                              ? "2px dashed #1976d2"
                              : "none",
                          outlineOffset: "-2px",
                          bgcolor:
                            dragOverAssignmentId ===
                            (assignment.assignmentCode?._id ??
                              "NO_ASSIGNMENTCODE")
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
                          {groupIndex + 6}
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
                          {assignment.assignmentCode?.deviceCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode
                            ? assignment.assignmentCode.name
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
                          {assignment.assignmentCode?.uom?.name}
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
                          {assignment.assignmentCode
                            ? formattedPrice(assignment.price)
                            : ""}
                        </TableCell>

                        {/* Mapped dynamic columns for Assignment */}
                        {blockKeys.map((bk, idx) => {
                          if (bk.isSummary) {
                            let planQtySum = 0;
                            let planCostSum = 0;
                            let usedQtySum = 0;
                            let usedCostSum = 0;
                            let varianceQtySum = 0;
                            let varianceCostSum = 0;

                            blockKeys
                              .filter(
                                (b) => b.month === bk.month && !b.isSummary,
                              )
                              .forEach((b) => {
                                const blockId = getBlockId(b.month, b.phaseId);
                                const blockData =
                                  assignment.blocks.get(blockId)?.groupData;
                                if (blockData) {
                                  planQtySum += Number(
                                    blockData.plan_Quantity || 0,
                                  );
                                  planCostSum += Number(
                                    blockData.plan_Cost || 0,
                                  );
                                  usedQtySum += Number(
                                    blockData.used_Quantity || 0,
                                  );
                                  usedCostSum += Number(
                                    blockData.used_Cost || 0,
                                  );
                                  varianceQtySum += Number(
                                    blockData.varianceQuantity || 0,
                                  );
                                  varianceCostSum += Number(
                                    blockData.varianceCost || 0,
                                  );
                                }
                              });

                            return (
                              <Fragment key={`asg_${idx}`}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                  <TableCell
                                    key={`asg_summary_cell_${idx}_${i}`}
                                    align="center"
                                    sx={{
                                      border: "1px solid #ddd",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                      p: 0.5,
                                      bgcolor:
                                        i >= 0 && i <= 1
                                          ? "#F3D01640"
                                          : i >= 2 && i <= 3
                                            ? "#4CAF503D"
                                            : i >= 4
                                              ? "#FF620040"
                                              : "white",
                                    }}
                                  >
                                    {i === 0
                                      ? assignment.assignmentCode &&
                                        planQtySum > 0
                                        ? formatDecimal(planQtySum)
                                        : ""
                                      : i === 1
                                        ? assignment.assignmentCode &&
                                          planCostSum > 0
                                          ? formattedPrice(planCostSum)
                                          : ""
                                        : i === 2
                                          ? assignment.assignmentCode &&
                                            usedQtySum > 0
                                            ? formatDecimal(usedQtySum)
                                            : ""
                                          : i === 3
                                            ? assignment.assignmentCode &&
                                              usedCostSum > 0
                                              ? formattedPrice(usedCostSum)
                                              : ""
                                            : i === 4
                                              ? assignment.assignmentCode &&
                                                varianceQtySum !== 0
                                                ? formatDecimal(varianceQtySum)
                                                : ""
                                              : i === 5
                                                ? assignment.assignmentCode &&
                                                  varianceCostSum !== 0
                                                  ? formattedPrice(
                                                      varianceCostSum,
                                                    )
                                                  : ""
                                                : ""}
                                  </TableCell>
                                ))}
                              </Fragment>
                            );
                          }

                          const blockId = getBlockId(bk.month, bk.phaseId);
                          const blockData =
                            assignment.blocks.get(blockId)?.groupData;

                          return (
                            <Fragment key={`asg_${idx}`}>
                              {showNorms(bk) && (
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
                                  {assignment.assignmentCode && blockData
                                    ? formatDecimal(Number(blockData.baseNorm))
                                    : ""}
                                </TableCell>
                              )}
                              {showNorms(bk) && (
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
                                  {assignment.assignmentCode && blockData
                                    ? formatDecimal(
                                        Number(blockData.adjustmentNorm),
                                      )
                                    : ""}
                                </TableCell>
                              )}
                              {showNorms(bk) && (
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
                                  {assignment.assignmentCode && blockData
                                    ? formatDecimal(Number(blockData.norm))
                                    : ""}
                                </TableCell>
                              )}

                              {Array.from({ length: 10 }).map((_, i) => (
                                <TableCell
                                  key={`asg_cell_${i}`}
                                  align="center"
                                  sx={{
                                    border: "1px solid #ddd",
                                    fontWeight: "normal",
                                    fontSize: "14px",
                                    p: 0.5,
                                    bgcolor:
                                      i >= 0 && i <= 3
                                        ? "#F3D01640"
                                        : i >= 4 && i <= 7
                                          ? "#4CAF503D"
                                          : i >= 8 && i <= 9
                                            ? "#FF620040"
                                            : "white",
                                  }}
                                >
                                  {i === 0
                                    ? assignment.assignmentCode && blockData
                                      ? formatDecimal(blockData.plan_Quantity)
                                      : ""
                                    : i === 1
                                      ? ""
                                      : i === 2
                                        ? ""
                                        : i === 3
                                          ? assignment.assignmentCode &&
                                            blockData
                                            ? formattedPrice(
                                                blockData.plan_Cost,
                                              )
                                            : ""
                                          : i === 4
                                            ? assignment.assignmentCode &&
                                              blockData
                                              ? formatDecimal(
                                                  blockData.used_Quantity,
                                                )
                                              : ""
                                            : i === 5
                                              ? ""
                                              : i === 6
                                                ? ""
                                                : i === 7
                                                  ? assignment.assignmentCode &&
                                                    blockData
                                                    ? formattedPrice(
                                                        blockData.used_Cost,
                                                      )
                                                    : ""
                                                  : i === 8
                                                    ? assignment.assignmentCode &&
                                                      blockData
                                                      ? formatDecimal(
                                                          blockData.varianceQuantity,
                                                        )
                                                      : ""
                                                    : i === 9
                                                      ? assignment.assignmentCode &&
                                                        blockData
                                                        ? formattedPrice(
                                                            blockData.varianceCost,
                                                          )
                                                        : ""
                                                      : ""}
                                </TableCell>
                              ))}
                            </Fragment>
                          );
                        })}
                      </TableRow>

                      {/* Mapped Material Rows */}
                      {Array.from({ length: assignment.maxRows }).map(
                        (_, i) => {
                          const materialMeta =
                            assignment.alignedMaterialsMeta[i];
                          if (!materialMeta) return null; // Nên có do maxRows == length

                          const materialUsedRef = materialMeta;
                          // Đếm trùng mã xuyên suốt toàn bộ bảng
                          const globalDuplicateCount = materialUsedRef.material
                            ?._id
                            ? allMaterialIds.filter(
                                (id) => id === materialUsedRef.material._id,
                              ).length
                            : 0;
                          const isDuplicate = globalDuplicateCount > 1;

                          return (
                            <TableRow
                              key={`mat_${assignment.compoundKey}_${i}`}
                              draggable={
                                canDragDrop &&
                                !materialUsedRef.material?.assignmentCode
                              }
                              onDragStart={
                                canDragDrop &&
                                !materialUsedRef.material?.assignmentCode
                                  ? (e) => {
                                      setDraggingItemId(
                                        materialUsedRef.materialItemId,
                                      );
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData(
                                        "application/json",
                                        JSON.stringify({
                                          materialId:
                                            materialUsedRef.material?._id,
                                          fromCompoundKey:
                                            assignment.compoundKey,
                                        }),
                                      );
                                    }
                                  : undefined
                              }
                              onDragEnd={
                                canDragDrop &&
                                !materialUsedRef.material?.assignmentCode
                                  ? () => setDraggingItemId(null)
                                  : undefined
                              }
                              sx={{
                                opacity:
                                  draggingItemId ===
                                  materialUsedRef.materialItemId
                                    ? 0.4
                                    : 1,
                                cursor:
                                  canDragDrop &&
                                  !materialUsedRef.material?.assignmentCode
                                    ? "grab"
                                    : "default",
                                "&:active": {
                                  cursor:
                                    canDragDrop &&
                                    !materialUsedRef.material?.assignmentCode
                                      ? "grabbing"
                                      : "default",
                                },
                                transition:
                                  "opacity 0.15s, background-color 0.7s ease",
                                "&:hover": { bgcolor: "#f5f5f5" },
                                bgcolor: discardHighlight.has(
                                  materialUsedRef.materialItemId,
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
                                {materialUsedRef.material?.code}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  border: "1px solid #ddd",
                                  fontWeight: "bold",
                                  color: isDuplicate ? "red" : "black",
                                  fontSize: "14px",
                                  p: 0.5,
                                }}
                              >
                                {globalDuplicateCount > 0
                                  ? globalDuplicateCount
                                  : ""}
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
                                {materialUsedRef.material?.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  border: "1px solid #ddd",
                                  fontSize: "14px",
                                  p: 0.5,
                                }}
                              >
                                {materialUsedRef.material?.uom?.name}
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
                                {assignment.assignmentCode
                                  ? ""
                                  : formattedPrice(materialUsedRef.price)}
                              </TableCell>

                              {/* Mapped dynamic columns for Material */}
                              {blockKeys.map((bk, idx) => {
                                if (bk.isSummary) {
                                  let planQtySum = 0;
                                  let planCostSum = 0;
                                  let usedQtySum = 0;
                                  let usedCostSum = 0;
                                  let varianceQtySum = 0;
                                  let varianceCostSum = 0;
                                  let hasData = false;

                                  blockKeys
                                    .filter(
                                      (b) =>
                                        b.month === bk.month && !b.isSummary,
                                    )
                                    .forEach((b) => {
                                      const blockId = getBlockId(
                                        b.month,
                                        b.phaseId,
                                      );
                                      const mu =
                                        assignment.blocks.get(blockId)
                                          ?.materialUseds?.[i];
                                      if (mu) {
                                        hasData = true;
                                        if (
                                          b.isOther ||
                                          !assignment.assignmentCode
                                        ) {
                                          planQtySum += Number(
                                            mu.quantity || 0,
                                          );
                                          planCostSum += Number(mu.cost || 0);
                                        }
                                        usedQtySum += Number(mu.quantity || 0);
                                        if (b.isOther) {
                                          usedCostSum += Number(mu.cost || 0);
                                        } else if (!assignment.assignmentCode) {
                                          usedCostSum += Number(mu.cost || 0);
                                        }
                                      }
                                    });

                                  return (
                                    <Fragment key={`mat_cell_${idx}`}>
                                      {Array.from({ length: 6 }).map(
                                        (_, colIdx) => (
                                          <TableCell
                                            key={`mat_summary_col_${colIdx}`}
                                            align="center"
                                            sx={{
                                              border: "1px solid #ddd",
                                              fontWeight: "normal",
                                              fontSize: "14px",
                                              p: 0.5,
                                              bgcolor:
                                                colIdx >= 0 && colIdx <= 1
                                                  ? "#F3D01640"
                                                  : colIdx >= 2 && colIdx <= 3
                                                    ? "#4CAF503D"
                                                    : colIdx >= 4
                                                      ? "#FF620040"
                                                      : "white",
                                            }}
                                          >
                                            {colIdx === 0
                                              ? hasData && planQtySum > 0
                                                ? formatDecimal(planQtySum)
                                                : ""
                                              : colIdx === 1
                                                ? hasData && planCostSum > 0
                                                  ? formattedPrice(planCostSum)
                                                  : ""
                                                : colIdx === 2
                                                  ? hasData && usedQtySum > 0
                                                    ? formatDecimal(usedQtySum)
                                                    : ""
                                                  : colIdx === 3
                                                    ? hasData && usedCostSum > 0
                                                      ? formattedPrice(
                                                          usedCostSum,
                                                        )
                                                      : ""
                                                    : colIdx === 4
                                                      ? hasData &&
                                                        varianceQtySum !== 0
                                                        ? formatDecimal(
                                                            varianceQtySum,
                                                          )
                                                        : ""
                                                      : colIdx === 5
                                                        ? hasData &&
                                                          varianceCostSum !== 0
                                                          ? formattedPrice(
                                                              varianceCostSum,
                                                            )
                                                          : ""
                                                        : ""}
                                          </TableCell>
                                        ),
                                      )}
                                    </Fragment>
                                  );
                                }

                                const blockId = getBlockId(
                                  bk.month,
                                  bk.phaseId,
                                );
                                const mu =
                                  assignment.blocks.get(blockId)
                                    ?.materialUseds?.[i];

                                return (
                                  <Fragment key={`mat_cell_${idx}`}>
                                    {showNorms(bk) && (
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
                                    {showNorms(bk) && (
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
                                    {showNorms(bk) && (
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

                                    {Array.from({ length: 10 }).map(
                                      (_, colIdx) => (
                                        <TableCell
                                          key={`mat_col_${colIdx}`}
                                          align="center"
                                          sx={{
                                            border: "1px solid #ddd",
                                            fontWeight: "normal",
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
                                          {colIdx === 0
                                            ? bk.isOther && mu
                                              ? formatDecimal(mu.quantity)
                                              : !assignment.assignmentCode && mu
                                                ? formatDecimal(mu.quantity)
                                                : ""
                                            : colIdx === 1
                                              ? ""
                                              : colIdx === 2
                                                ? ""
                                                : colIdx === 3
                                                  ? bk.isOther && mu
                                                    ? formattedPrice(mu.cost)
                                                    : !assignment.assignmentCode &&
                                                        mu
                                                      ? formattedPrice(mu.cost)
                                                      : ""
                                                  : colIdx === 4
                                                    ? mu
                                                      ? formatDecimal(
                                                          mu.quantity,
                                                        )
                                                      : ""
                                                    : colIdx === 5
                                                      ? ""
                                                      : colIdx === 6
                                                        ? ""
                                                        : colIdx === 7
                                                          ? bk.isOther && mu
                                                            ? formattedPrice(
                                                                mu.cost,
                                                              )
                                                            : assignment.assignmentCode
                                                              ? ""
                                                              : mu
                                                                ? formattedPrice(
                                                                    mu.cost,
                                                                  )
                                                                : ""
                                                          : colIdx === 8
                                                            ? bk.isOther
                                                              ? ""
                                                              : !assignment.assignmentCode &&
                                                                  mu
                                                                ? formatDecimal(
                                                                    0,
                                                                  )
                                                                : ""
                                                            : colIdx === 9
                                                              ? bk.isOther
                                                                ? ""
                                                                : !assignment.assignmentCode &&
                                                                    mu
                                                                  ? formattedPrice(
                                                                      0,
                                                                    )
                                                                  : ""
                                                              : ""}
                                        </TableCell>
                                      ),
                                    )}
                                  </Fragment>
                                );
                              })}
                            </TableRow>
                          );
                        },
                      )}
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
                      if (bk.isSummary) {
                        let totalPlanSum = 0;
                        let totalUsedSum = 0;

                        blockKeys
                          .filter((b) => b.month === bk.month && !b.isSummary)
                          .forEach((b) => {
                            const blockId = getBlockId(b.month, b.phaseId);
                            rowGroups.forEach((rg) => {
                              const bd = rg.blocks.get(blockId)?.groupData;
                              if (rg.assignmentCode && bd) {
                                totalPlanSum += Number(bd.plan_Cost || 0);
                                totalUsedSum += Number(bd.used_Cost || 0);
                              } else if (!rg.assignmentCode) {
                                const mus =
                                  rg.blocks.get(blockId)?.materialUseds;
                                if (mus) {
                                  mus.forEach((mu) => {
                                    if (mu) {
                                      totalPlanSum += Number(mu.cost || 0);
                                      totalUsedSum += Number(mu.cost || 0);
                                    }
                                  });
                                }
                              }
                            });
                          });

                        const totalVarianceSum = totalPlanSum - totalUsedSum;

                        return (
                          <Fragment key={`total_block_${idx}`}>
                            {Array.from({ length: 6 }).map((_, colIdx) => (
                              <TableCell
                                key={`total_summary_col_${colIdx}`}
                                align="center"
                                sx={{
                                  border: "1px solid #ddd",
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                  p: 0.5,
                                  bgcolor:
                                    colIdx >= 0 && colIdx <= 1
                                      ? "#F3D01640"
                                      : colIdx >= 2 && colIdx <= 3
                                        ? "#4CAF503D"
                                        : colIdx >= 4
                                          ? "#FF620040"
                                          : "white",
                                }}
                              >
                                {colIdx === 1
                                  ? formattedPrice(totalPlanSum)
                                  : colIdx === 3
                                    ? formattedPrice(totalUsedSum)
                                    : colIdx === 5
                                      ? formattedPrice(totalVarianceSum)
                                      : ""}
                              </TableCell>
                            ))}
                          </Fragment>
                        );
                      }

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
                            mus.forEach((mu) => {
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
                          {showNorms(bk) && (
                            <>
                              <TableCell
                                sx={{
                                  border: "1px solid #ddd",
                                  bgcolor: "#F3D01640",
                                }}
                              ></TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #ddd",
                                  bgcolor: "#F3D01640",
                                }}
                              ></TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #ddd",
                                  bgcolor: "#F3D01640",
                                }}
                              ></TableCell>
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
                              {colIdx === 3
                                ? formattedPrice(totalPlan)
                                : colIdx === 7
                                  ? formattedPrice(totalUsed)
                                  : colIdx === 9
                                    ? formattedPrice(totalVariance)
                                    : ""}
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
        </Box>
      )}
    </Paper>
  );
}
