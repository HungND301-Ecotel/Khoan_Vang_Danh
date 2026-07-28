import React, { Fragment, useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FieldRangeMonthYear from "../../ui/FieldRangeMonth_Year";
import dayjs from "dayjs";
import SettlementService from "../../service/SettlementRepotr";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import FieldAutoCompleted from "../../components/TextField/FieldAutoCompleted";
import {
  ContractSettlementResponse,
  DataItem,
  MonthlyDataAllScopes,
  MonthlyDataWithPhase,
} from "../../types";
import { useSettlementTableData } from "../../hooks/useSettlementTableData";

const getBlockId = (month: string, phaseId?: string) =>
  phaseId ? `${month}_${phaseId}` : month;

const cellBorder = { border: "1px solid #e0e0e0" };

export default function ContractSettlementReport() {
  const [fromMonth, setFromMonth] = useState(
    dayjs(new Date()).format("YYYY-MM"),
  );
  const [toMonth, setToMonth] = useState(dayjs(new Date()).format("YYYY-MM"));
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [localData, setLocalData] = useState<Map<string, DataItem[]>>(
    new Map(),
  );

  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = React.useState<number>(0);

  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data),
  });

  const { data: apiResponse = [], isLoading } =
    useQuery<ContractSettlementResponse>({
      queryKey: ["contractsettlements", fromMonth, toMonth, selectedDepartment],
      queryFn: () =>
        SettlementService.getContractSettlements(
          fromMonth,
          toMonth,
          "",
          "",
          selectedDepartment,
        ),
      enabled: !!fromMonth && !!toMonth && !!selectedDepartment,
    });

  const transformedResponse = useMemo(() => {
    if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0)
      return [];

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

        if (Array.isArray(monthEntry.otherTasks.phases)) {
          monthEntry.otherTasks.phases.forEach((p: any) => {
            const unit = (p.unit || "").toLowerCase().trim();
            const phaseName = (p.phase?.name || "").toLowerCase();
            const phaseGroupName = (
              p.phase?.phaseGroup?.name || ""
            ).toLowerCase();
            const prod = p.production || 0;

            if (unit === "tấn" || unit === "t" || unit === "tan") {
              totalCoal += prod;
            } else if (unit === "mét" || unit === "m" || unit === "met") {
              if (phaseName.includes("xén") || phaseGroupName.includes("xén")) {
                totalCutting += prod;
              } else {
                totalExcavation += prod;
              }
            }
          });
        }

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
  }, [apiResponse]);

  const { blockKeys, rowGroups } = useSettlementTableData(
    transformedResponse as any,
    localData,
    true,
    true,
  );

  useEffect(() => {
    let animationFrameId: number;

    const updateWidth = () => {
      // Tránh tính toán nếu component đã bị unmount
      if (!tableContainerRef.current && !tableRef.current) return;

      let newWidth = 0;
      if (tableContainerRef.current) {
        newWidth = tableContainerRef.current.scrollWidth;
      } else if (tableRef.current) {
        newWidth = tableRef.current.offsetWidth;
      }

      setTableWidth((prevWidth) =>
        prevWidth !== newWidth ? newWidth : prevWidth,
      );
    };

    const observer = new ResizeObserver(() => {
      // Sử dụng requestAnimationFrame để hoãn việc setState cho tới khung hình tiếp theo, tránh loop liên tục
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateWidth);
    });

    if (tableRef.current) observer.observe(tableRef.current);
    if (tableContainerRef.current) observer.observe(tableContainerRef.current);

    updateWidth();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [apiResponse, blockKeys]);

  // Sync localData khi API response thay đổi
  useEffect(() => {
    if (!transformedResponse?.length) {
      setLocalData((prev) => (prev.size !== 0 ? new Map() : prev));
      return;
    }
    const map = new Map<string, DataItem[]>();
    (transformedResponse as MonthlyDataWithPhase[]).forEach((monthEntry) => {
      (monthEntry.phases || []).forEach((phaseEntry) => {
        const key = `${monthEntry.month}_${phaseEntry.phaseId}`;
        map.set(key, phaseEntry.data);
      });
    });
    setLocalData(map);
  }, [transformedResponse]);

  const handleExport = async () => {
    if (!selectedDepartment) return;
    try {
      await SettlementService.exportFile({
        fromMonth,
        toMonth,
        department: selectedDepartment,
      });
    } catch (error) {
      console.error("Export error", error);
    }
  };

  const selectedDeptName = useMemo(() => {
    const dept = (departments?.data || []).find(
      (d: any) => d._id === selectedDepartment,
    );
    return dept ? dept.name : "";
  }, [departments, selectedDepartment]);

  // Số cột của 1 block theo loại: summary = 6, công việc khác = 10 (không có 3 cột định mức), bình thường = 13
  const getColCount = (bk: any) => (bk.isSummary ? 6 : bk.isOther ? 10 : 13);

  const theadRef = React.useRef<HTMLTableSectionElement>(null);
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
        p: 3,
        width: "100%",
        boxSizing: "border-box",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        minWidth: 0,
      }}
    >
      {/* Top Filter Bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          mb: 4,
          pb: 2,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <FieldAutoCompleted
          title="Chọn phân xưởng"
          data={departments?.data || []}
          value={selectedDepartment}
          onChange={(val: any) => setSelectedDepartment(val?._id || "")}
          labelkey="name"
        />

        <FieldRangeMonthYear
          fromMonth={fromMonth}
          toMonth={toMonth}
          setFromMonth={setFromMonth}
          setToMonth={setToMonth}
        />

        <Button
          variant="contained"
          onClick={handleExport}
          startIcon={<FileDownloadIcon />}
          disabled={!selectedDepartment || isLoading}
          sx={{
            ml: "auto",
            height: 40,
            bgcolor: "#1B365D",
            color: "#fff",
            textTransform: "none",
            fontWeight: "bold",
            "&:hover": {
              bgcolor: "#102A43",
            },
          }}
        >
          Xuất file Excel
        </Button>
      </Box>

      {/* Report Header Title */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{ color: "#1B365D", mb: 1, letterSpacing: "0.5px" }}
        >
          BÁO CÁO QUYẾT TOÁN GIAO KHOÁN
        </Typography>
        {selectedDeptName && (
          <Typography
            variant="subtitle1"
            fontWeight="500"
            sx={{ color: "#666" }}
          >
            Đơn vị: {selectedDeptName}
          </Typography>
        )}
        <Typography
          variant="subtitle2"
          sx={{ color: "#888", fontStyle: "italic" }}
        >
          Thời gian: Từ tháng {dayjs(fromMonth, "YYYY-MM").format("MM/YYYY")}{" "}
          đến tháng {dayjs(toMonth, "YYYY-MM").format("MM/YYYY")}
        </Typography>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress size={40} sx={{ color: "#1B365D" }} />
          <Typography sx={{ ml: 2, color: "#666", fontWeight: "medium" }}>
            Đang tải dữ liệu báo cáo...
          </Typography>
        </Box>
      )}

      {/* No Data State */}
      {!isLoading && blockKeys.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "#999",
            bgcolor: "#fcfcfc",
            border: "1px dashed #e0e0e0",
            borderRadius: "8px",
          }}
        >
          <Typography variant="body1">
            Vui lòng chọn phân xưởng và khoảng thời gian hợp lệ để xem dữ liệu
            quyết toán.
          </Typography>
        </Box>
      )}

      {/* Main Report Table */}
      {!isLoading && blockKeys.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mb: 4,
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* Top scrollbar container */}
          <Box
            ref={topScrollRef}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              position: "sticky",
              top: 100,
              zIndex: 11,
              bgcolor: "white",
              borderBottom: "1px solid #ddd",
            }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              if (
                tableContainerRef.current &&
                tableContainerRef.current.scrollLeft !== target.scrollLeft
              ) {
                tableContainerRef.current.scrollLeft = target.scrollLeft;
              }
            }}
          >
            <Box sx={{ width: tableWidth, height: "1px" }} />
          </Box>

          {/* Table container */}
          <Box
            ref={tableContainerRef}
            sx={{
              overflowX: "auto",
              width: "100%",
            }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              if (
                topScrollRef.current &&
                topScrollRef.current.scrollLeft !== target.scrollLeft
              ) {
                topScrollRef.current.scrollLeft = target.scrollLeft;
              }
            }}
          >
            <Table
              ref={tableRef}
              sx={{ tableLayout: "auto", width: "100%" }}
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
                {/* Row 1: Tiêu đề tháng */}
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={8}
                    sx={{ ...cellBorder, p: 0.5 }}
                  />
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={getColCount(bk)}
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        p: 0.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Quyết toán giao khoán tháng{" "}
                      {dayjs(bk.month, "YYYY-MM").format("MM/YYYY")}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Row 2: Phase codes */}
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={8}
                    sx={{ ...cellBorder, p: 0.5 }}
                  />
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={getColCount(bk)}
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        p: 0.5,
                      }}
                    >
                      {bk.phaseCode ??
                        bk.info?.phases?.map((i: any) => i?.code).join(", ")}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Row 3: Production scope */}
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={8}
                    sx={{ ...cellBorder, p: 0.5 }}
                  />
                  {blockKeys.map((bk, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      colSpan={getColCount(bk)}
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        p: 0.5,
                      }}
                    >
                      {bk.isSummary
                        ? ""
                        : bk.isOther
                          ? "Công việc"
                          : (bk.info?.productionScopes || [])
                              .map((i: any) => i?.code)
                              .join(", ")}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Row 4: Kế hoạch / Thực hiện / So sánh */}
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={8}
                    sx={{ ...cellBorder, p: 0.5 }}
                  />
                  {blockKeys.map((bk, idx) => (
                    <Fragment key={idx}>
                      <TableCell
                        align="center"
                        colSpan={bk.isSummary ? 2 : bk.isOther ? 4 : 7}
                        sx={{
                          ...cellBorder,
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          p: 0.5,
                        }}
                      >
                        Kế hoạch
                      </TableCell>
                      <TableCell
                        align="center"
                        colSpan={bk.isSummary ? 2 : bk.isOther ? 4 : 4}
                        sx={{
                          ...cellBorder,
                          fontWeight: "bold",
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
                          ...cellBorder,
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          p: 0.5,
                        }}
                      >
                        So sánh lãi(+); lỗ(-)
                      </TableCell>
                    </Fragment>
                  ))}
                </TableRow>

                {/* Row 5: Column headers (Định mức / Số lượng / Giá trị) */}
                <TableRow>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 40,
                    }}
                  >
                    STT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 100,
                    }}
                  >
                    Mã vật tư, tài sản
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 50,
                    }}
                  >
                    Trùng mã vật tư
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 100,
                    }}
                  >
                    Mã thiết bị
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 100,
                    }}
                  >
                    Mã giao khoán
                  </TableCell>
                  <TableCell
                    align="left"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 200,
                    }}
                  >
                    Tên vật tư, tài sản
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 60,
                    }}
                  >
                    ĐVT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 100,
                    }}
                  >
                    Đơn giá khoán
                  </TableCell>
                  {blockKeys.map((bk, idx) => (
                    <Fragment key={idx}>
                      {bk.isSummary ? (
                        <>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                        </>
                      ) : bk.isOther ? (
                        <>
                          {/* Công việc khác: không có 3 cột định mức, 10 cột tổng */}
                          <TableCell
                            align="center"
                            colSpan={3}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            colSpan={3}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Định mức gốc
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Hệ số điều chỉnh
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Định mức
                          </TableCell>
                          <TableCell
                            align="center"
                            colSpan={3}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            colSpan={3}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 70,
                            }}
                          >
                            Số lượng
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={2}
                            sx={{
                              ...cellBorder,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              p: 0.5,
                              minWidth: 90,
                            }}
                          >
                            Giá trị
                          </TableCell>
                        </>
                      )}
                    </Fragment>
                  ))}
                </TableRow>

                {/* Row 6: Sub headers (Tổng, Trong khoán, Ngoài khoán) - chỉ cho phần "Số lượng" colSpan=3 */}
                <TableRow>
                  {blockKeys.map((bk, idx) => {
                    if (bk.isSummary) return null; // đã rowSpan ở row 5
                    // Cả isOther và block thường đều có 2 nhóm "Số lượng" (Kế hoạch + Thực hiện), mỗi nhóm 3 cột con
                    return (
                      <Fragment key={idx}>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Tổng
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Trong khoán
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Ngoài khoán
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Tổng
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Trong khoán
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            p: 0.5,
                            minWidth: 55,
                          }}
                        >
                          Ngoài khoán
                        </TableCell>
                      </Fragment>
                    );
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Row 1: Than nguyên khai */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    1
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
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
                              sx={{ ...cellBorder, p: 0.5 }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumCoal) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }
                    const info = bk.info;
                    const colCount = getColCount(bk);
                    const valueColIdx = bk.isOther ? 4 : 7; // vị trí cột "Tổng" của Thực hiện
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: colCount }).map((_, i) => (
                          <TableCell
                            key={`${idx}_${i}`}
                            sx={{ ...cellBorder, p: 0.5 }}
                            align="center"
                          >
                            {i === valueColIdx
                              ? formatDecimal(info?.totalCoal || 0)
                              : ""}
                          </TableCell>
                        ))}
                      </Fragment>
                    );
                  })}
                </TableRow>

                {/* Row 2: Mét lò đào */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    2
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
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
                              sx={{ ...cellBorder, p: 0.5 }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumExcavation) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }
                    const info = bk.info;
                    const colCount = getColCount(bk);
                    const valueColIdx = bk.isOther ? 4 : 7;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: colCount }).map((_, i) => (
                          <TableCell
                            key={`${idx}_${i}`}
                            sx={{ ...cellBorder, p: 0.5 }}
                            align="center"
                          >
                            {i === valueColIdx
                              ? formatDecimal(info?.totalExcavation || 0)
                              : ""}
                          </TableCell>
                        ))}
                      </Fragment>
                    );
                  })}
                </TableRow>

                {/* Row 3: Mét lò xén */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    3
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
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
                              sx={{ ...cellBorder, p: 0.5 }}
                              align="center"
                            >
                              {i === 2 ? formatDecimal(sumCutting) : ""}
                            </TableCell>
                          ))}
                        </Fragment>
                      );
                    }
                    const info = bk.info;
                    const colCount = getColCount(bk);
                    const valueColIdx = bk.isOther ? 4 : 7;
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: colCount }).map((_, i) => (
                          <TableCell
                            key={`${idx}_${i}`}
                            sx={{ ...cellBorder, p: 0.5 }}
                            align="center"
                          >
                            {i === valueColIdx
                              ? formatDecimal(info?.totalCutting || 0)
                              : ""}
                          </TableCell>
                        ))}
                      </Fragment>
                    );
                  })}
                </TableRow>

                {/* Row 4: Tỉ lệ đá lẫn */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    4
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
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
                              sx={{ ...cellBorder, p: 0.5 }}
                            />
                          ))}
                        </Fragment>
                      );
                    }
                    const info = bk.info;
                    const colCount = getColCount(bk);
                    const valueColIdx = bk.isOther ? 0 : 3; // vị trí cột "Định mức" (chỉ có ở block thường)
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: colCount }).map((_, i) => (
                          <TableCell
                            key={`${idx}_${i}`}
                            sx={{ ...cellBorder, p: 0.5 }}
                            align="center"
                          >
                            {!bk.isOther && i === valueColIdx
                              ? info?.rockRatio
                              : ""}
                          </TableCell>
                        ))}
                      </Fragment>
                    );
                  })}
                </TableRow>

                {/* Row 5: Vật tư có định mức */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    5
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    sx={{ ...cellBorder, fontWeight: "bold", p: 0.5 }}
                  >
                    Vật tư có định mức
                  </TableCell>
                  {blockKeys.map((bk, idx) => {
                    const colCount = getColCount(bk);
                    return (
                      <Fragment key={idx}>
                        {Array.from({ length: colCount }).map((_, i) => (
                          <TableCell
                            key={`${idx}_${i}`}
                            sx={{ ...cellBorder, p: 0.5 }}
                          />
                        ))}
                      </Fragment>
                    );
                  })}
                </TableRow>

                {/* Row Groups */}
                {rowGroups.map((rowGroup, groupIndex) => {
                  const assignment = rowGroup;

                  return (
                    <Fragment key={assignment.compoundKey}>
                      {/* Assignment Code Row */}
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        >
                          {groupIndex + 6}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode?.deviceCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "0.85rem",
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
                            ...cellBorder,
                            fontWeight: "normal",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode?.uom?.name}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "normal",
                            fontSize: "0.85rem",
                            p: 0.5,
                          }}
                        >
                          {assignment.assignmentCode
                            ? formattedPrice(assignment.plan_Price)
                            : ""}
                        </TableCell>

                        {/* Mapped columns for Assignment */}
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
                                      ...cellBorder,
                                      fontWeight: "bold",
                                      fontSize: "0.85rem",
                                      p: 0.5,
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
                          const colCount = getColCount(bk);

                          if (bk.isOther) {
                            // 10 cột: KH(SL Tổng,Trong,Ngoài,GiáTrị) TH(SL Tổng,Trong,Ngoài,GiáTrị) SS(SL,GiáTrị)
                            return (
                              <Fragment key={`asg_${idx}`}>
                                {Array.from({ length: colCount }).map(
                                  (_, i) => (
                                    <TableCell
                                      key={`asg_cell_${i}`}
                                      align="center"
                                      sx={{
                                        ...cellBorder,
                                        fontWeight: "normal",
                                        fontSize: "0.85rem",
                                        p: 0.5,
                                      }}
                                    >
                                      {i === 0
                                        ? assignment.assignmentCode && blockData
                                          ? formatDecimal(
                                              blockData.plan_Quantity,
                                            )
                                          : ""
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
                                  ),
                                )}
                              </Fragment>
                            );
                          }

                          return (
                            <Fragment key={`asg_${idx}`}>
                              {Array.from({ length: colCount }).map((_, i) => (
                                <TableCell
                                  key={`asg_cell_${i}`}
                                  align="center"
                                  sx={{
                                    ...cellBorder,
                                    fontWeight: "normal",
                                    fontSize: "0.85rem",
                                    p: 0.5,
                                  }}
                                >
                                  {i === 0
                                    ? assignment.assignmentCode && blockData
                                      ? formatDecimal(
                                          Number(blockData.baseNorm),
                                        )
                                      : ""
                                    : i === 1
                                      ? assignment.assignmentCode && blockData
                                        ? formatDecimal(
                                            Number(blockData.adjustmentNorm),
                                          )
                                        : ""
                                      : i === 2
                                        ? assignment.assignmentCode && blockData
                                          ? formatDecimal(
                                              Number(blockData.norm),
                                            )
                                          : ""
                                        : i === 3
                                          ? assignment.assignmentCode &&
                                            blockData
                                            ? formatDecimal(
                                                blockData.plan_Quantity,
                                              )
                                            : ""
                                          : i === 4
                                            ? assignment.assignmentCode &&
                                              blockData
                                              ? formatDecimal(
                                                  blockData.plan_QuantityInPlan,
                                                )
                                              : ""
                                            : i === 5
                                              ? assignment.assignmentCode &&
                                                blockData &&
                                                blockData.plan_QuantityOutside >
                                                  0
                                                ? formatDecimal(
                                                    blockData.plan_QuantityOutside,
                                                  )
                                                : ""
                                              : i === 6
                                                ? assignment.assignmentCode &&
                                                  blockData
                                                  ? formattedPrice(
                                                      blockData.plan_Cost,
                                                    )
                                                  : ""
                                                : i === 7
                                                  ? assignment.assignmentCode &&
                                                    blockData
                                                    ? formatDecimal(
                                                        blockData.used_Quantity,
                                                      )
                                                    : ""
                                                  : i === 8
                                                    ? ""
                                                    : i === 9
                                                      ? ""
                                                      : i === 10
                                                        ? assignment.assignmentCode &&
                                                          blockData
                                                          ? formattedPrice(
                                                              blockData.used_Cost,
                                                            )
                                                          : ""
                                                        : i === 11
                                                          ? assignment.assignmentCode &&
                                                            blockData
                                                            ? formatDecimal(
                                                                blockData.varianceQuantity,
                                                              )
                                                            : ""
                                                          : i === 12
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
                          if (!materialMeta) return null;

                          const isDuplicate =
                            assignment.alignedMaterialsMeta.filter(
                              (m) =>
                                m?.material?._id === materialMeta.material?._id,
                            ).length > 1;

                          return (
                            <TableRow
                              key={`mat_${assignment.compoundKey}_${i}`}
                              sx={{
                                "&:hover": { bgcolor: "#f9f9f9" },
                                bgcolor: isDuplicate
                                  ? "#ffebee"
                                  : "transparent",
                              }}
                            >
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              ></TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              >
                                {materialMeta.material?.code}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontWeight: "bold",
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              >
                                {isDuplicate
                                  ? assignment.alignedMaterialsMeta.filter(
                                      (m) =>
                                        m?.material?._id ===
                                        materialMeta.material?._id,
                                    ).length
                                  : 1}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              ></TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              ></TableCell>
                              <TableCell
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              >
                                {materialMeta.material?.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              >
                                {materialMeta.material?.uom?.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontWeight: "normal",
                                  fontSize: "0.85rem",
                                  p: 0.5,
                                }}
                              >
                                {assignment.assignmentCode
                                  ? ""
                                  : formattedPrice(materialMeta.price)}
                              </TableCell>

                              {/* Columns for Materials */}
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
                                        if (
                                          b.isOther ||
                                          !assignment.assignmentCode
                                        ) {
                                          usedCostSum += Number(mu.cost || 0);
                                        }
                                      }
                                    });

                                  varianceQtySum = planQtySum - usedQtySum;
                                  varianceCostSum = planCostSum - usedCostSum;

                                  return (
                                    <Fragment key={`mat_cell_${idx}`}>
                                      {Array.from({ length: 6 }).map(
                                        (_, colIdx) => (
                                          <TableCell
                                            key={`mat_summary_col_${colIdx}`}
                                            align="center"
                                            sx={{
                                              ...cellBorder,
                                              fontWeight: "normal",
                                              fontSize: "0.85rem",
                                              p: 0.5,
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
                                const colCount = getColCount(bk);

                                if (bk.isOther) {
                                  // isOther: SL/Giá trị nằm ở cột "Tổng" (offset 0 và 4), không phải "Ngoài khoán"
                                  return (
                                    <Fragment key={`mat_cell_${idx}`}>
                                      {Array.from({ length: colCount }).map(
                                        (_, colIdx) => (
                                          <TableCell
                                            key={`mat_col_${colIdx}`}
                                            align="center"
                                            sx={{
                                              ...cellBorder,
                                              fontWeight: "normal",
                                              fontSize: "0.85rem",
                                              p: 0.5,
                                            }}
                                          >
                                            {colIdx === 0
                                              ? mu
                                                ? formatDecimal(mu.quantity)
                                                : ""
                                              : colIdx === 3
                                                ? mu
                                                  ? formattedPrice(mu.cost)
                                                  : ""
                                                : colIdx === 4
                                                  ? mu
                                                    ? formatDecimal(mu.quantity)
                                                    : ""
                                                  : colIdx === 7
                                                    ? mu
                                                      ? formattedPrice(mu.cost)
                                                      : ""
                                                    : ""}
                                          </TableCell>
                                        ),
                                      )}
                                    </Fragment>
                                  );
                                }

                                return (
                                  <Fragment key={`mat_cell_${idx}`}>
                                    {Array.from({ length: colCount }).map(
                                      (_, colIdx) => (
                                        <TableCell
                                          key={`mat_col_${colIdx}`}
                                          align="center"
                                          sx={{
                                            ...cellBorder,
                                            fontWeight: "normal",
                                            fontSize: "0.85rem",
                                            p: 0.5,
                                          }}
                                        >
                                          {colIdx === 3
                                            ? !assignment.assignmentCode && mu
                                              ? formatDecimal(mu.quantity)
                                              : ""
                                            : colIdx === 6
                                              ? !assignment.assignmentCode && mu
                                                ? formattedPrice(mu.cost)
                                                : ""
                                              : colIdx === 7
                                                ? mu
                                                  ? formatDecimal(mu.quantity)
                                                  : ""
                                                : colIdx === 10
                                                  ? assignment.assignmentCode
                                                    ? ""
                                                    : mu
                                                      ? formattedPrice(mu.cost)
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

                {/* Bottom summary row */}
                {rowGroups.length > 0 && (
                  <TableRow>
                    <TableCell
                      align="center"
                      colSpan={8}
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        fontSize: "0.85rem",
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
                                  ...cellBorder,
                                  fontWeight: "bold",
                                  fontSize: "0.85rem",
                                  p: 0.5,
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
                      const colCount = getColCount(bk);

                      if (bk.isOther) {
                        return (
                          <Fragment key={`total_block_${idx}`}>
                            {Array.from({ length: colCount }).map(
                              (_, colIdx) => (
                                <TableCell
                                  key={`total_col_${colIdx}`}
                                  align="center"
                                  sx={{
                                    ...cellBorder,
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                    p: 0.5,
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
                              ),
                            )}
                          </Fragment>
                        );
                      }

                      return (
                        <Fragment key={`total_block_${idx}`}>
                          {Array.from({ length: colCount }).map((_, colIdx) => (
                            <TableCell
                              key={`total_col_${colIdx}`}
                              align="center"
                              sx={{
                                ...cellBorder,
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                                p: 0.5,
                              }}
                            >
                              {colIdx === 6
                                ? formattedPrice(totalPlan)
                                : colIdx === 10
                                  ? formattedPrice(totalUsed)
                                  : colIdx === 12
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
