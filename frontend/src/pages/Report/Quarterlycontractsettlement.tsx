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
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import SettlementService from "../../service/SettlementRepotr";
import { parseAxiosError } from "../../utils/handleApiError";
import { showErrorAlert } from "../../components/Alert";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import FieldAutoCompleted from "../../components/TextField/FieldAutoCompleted";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const cellBorder = { border: "1px solid #e0e0e0" };

export default function Quarterlycontractsettlement() {
  const [selectedQuarter, setSelectedQuarter] = useState("1");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const years = [];
  for (let i = 0; i < 20; i++) {
    years.push({ _id: (currentYear - i).toString(), label: currentYear - i });
  }

  const quarters = [
    { _id: "1", label: "Quý 1" },
    { _id: "2", label: "Quý 2" },
    { _id: "3", label: "Quý 3" },
    { _id: "4", label: "Quý 4" },
  ];

  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data),
  });

  const { data: contractsettlements = { data: [], info: {} }, isLoading } =
    useQuery({
      queryKey: [
        "contractsettlements-quarter",
        selectedQuarter,
        selectedYear,
        selectedDepartment,
      ],
      queryFn: () =>
        api
          .get(
            `/contractsettlements/getQuarter?quarter=${Number(selectedQuarter)}&year=${Number(selectedYear)}&department=${selectedDepartment}`,
          )
          .then((res) => res.data.data),
      enabled: !!selectedQuarter && !!selectedYear && !!selectedDepartment,
    });

  const exportExcel = useMutation({
    mutationFn: () =>
      SettlementService.exportQuarterFile({
        quarter: selectedQuarter,
        year: selectedYear,
        department: selectedDepartment,
      }),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const selectedDeptName = React.useMemo(() => {
    const dept = (departments?.data || []).find(
      (d: any) => d._id === selectedDepartment,
    );
    return dept ? dept.name : "";
  }, [departments, selectedDepartment]);

  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const updateWidth = () => {
      if (tableContainerRef.current) {
        setTableWidth(tableContainerRef.current.scrollWidth);
      } else if (tableRef.current) {
        setTableWidth(tableRef.current.offsetWidth);
      }
    };

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    if (tableRef.current) observer.observe(tableRef.current);
    if (tableContainerRef.current) observer.observe(tableContainerRef.current);

    updateWidth();

    return () => observer.disconnect();
  }, [contractsettlements]);

  const theadRef = React.useRef<HTMLTableSectionElement>(null);

  React.useEffect(() => {
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
  }, [contractsettlements]);

  const hasData = !!selectedDepartment && !isLoading;

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
      {/* Top Filter Bar - đồng bộ với báo cáo tháng */}
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

        <FieldAutoCompleted
          title="Chọn quý"
          data={quarters}
          value={selectedQuarter}
          onChange={(val: any) => setSelectedQuarter(val?._id || "1")}
          labelkey="label"
        />

        <FieldAutoCompleted
          title="Chọn năm"
          data={years}
          value={selectedYear}
          onChange={(val: any) =>
            setSelectedYear(val?._id || currentYear.toString())
          }
          labelkey="label"
        />

        <Button
          variant="contained"
          onClick={() => exportExcel.mutate()}
          startIcon={<FileDownloadIcon />}
          disabled={!selectedDepartment || exportExcel.isPending}
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
          {exportExcel.isPending ? "Đang xuất..." : "Xuất file Excel"}
        </Button>
      </Box>

      {/* Report Header Title - đồng bộ với báo cáo tháng */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{ color: "#1B365D", mb: 1, letterSpacing: "0.5px" }}
        >
          BÁO CÁO QUYẾT TOÁN GIAO KHOÁN QUÝ
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
        {selectedQuarter && selectedYear && (
          <Typography
            variant="subtitle2"
            sx={{ color: "#888", fontStyle: "italic" }}
          >
            Thời gian: Quý {selectedQuarter} năm {selectedYear}
          </Typography>
        )}
      </Box>

      {/* Loading State */}
      {isLoading && !!selectedDepartment && (
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
      {!selectedDepartment && (
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
            Vui lòng chọn phân xưởng, quý và năm để xem dữ liệu quyết toán.
          </Typography>
        </Box>
      )}

      {/* Main Report Table */}
      {selectedDepartment && !isLoading && (
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
              if (tableContainerRef.current) {
                tableContainerRef.current.scrollLeft = (
                  e.target as HTMLDivElement
                ).scrollLeft;
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
              if (topScrollRef.current) {
                topScrollRef.current.scrollLeft = (
                  e.target as HTMLDivElement
                ).scrollLeft;
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
                <TableRow>
                  <TableCell
                    align="center"
                    rowSpan={5}
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
                    rowSpan={5}
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
                    rowSpan={5}
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
                    rowSpan={5}
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
                    rowSpan={5}
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
                    rowSpan={5}
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
                    rowSpan={5}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      minWidth: 100,
                    }}
                  >
                    Đơn giá khoán
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={10}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                      fontSize: "0.75rem",
                      p: 0.5,
                    }}
                  >
                    Quyết toán giao khoán quý {selectedQuarter} năm{" "}
                    {selectedYear}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={10}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                      fontSize: "0.75rem",
                      p: 0.5,
                    }}
                  >
                    Bảng tổng hợp
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={4}
                    sx={{
                      ...cellBorder,
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
                      ...cellBorder,
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
                      ...cellBorder,
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
                    colSpan={3}
                    sx={{
                      ...cellBorder,
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
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
                      bgcolor: "#F3D01640",
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
                      bgcolor: "#4CAF503D",
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
                      bgcolor: "#4CAF503D",
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
                      bgcolor: "#FF620040",
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
                      bgcolor: "#FF620040",
                      fontSize: "0.75rem",
                      p: 0.5,
                      minWidth: 90,
                    }}
                  >
                    Giá trị
                  </TableCell>
                </TableRow>
                <TableRow>
                  {[
                    "Tổng",
                    "Trong khoán",
                    "Ngoài khoán",
                    "Tổng",
                    "Trong khoán",
                    "Ngoài khoán",
                  ].map((label, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        bgcolor: i <= 2 ? "#F3D01640" : "#4CAF503D",
                        fontSize: "0.7rem",
                        p: 0.5,
                        minWidth: 55,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {[
                  {
                    label: "Than nguyên khai",
                    val: contractsettlements?.info?.totalCoal,
                  },
                  {
                    label: "Mét lò đào",
                    val: contractsettlements?.info?.totalExcavation,
                  },
                  {
                    label: "Mét lò xén",
                    val: contractsettlements?.info?.totalCutting,
                  },
                  { label: "Tỉ lệ đá lẫn trong gương (Ckep)", val: null },
                  { label: "Vật tư có định mức", val: null },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      align="center"
                      sx={{
                        ...cellBorder,
                        fontWeight: "bold",
                        fontSize: "14px",
                        p: 0.5,
                      }}
                    >
                      {idx + 1}
                    </TableCell>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          ...cellBorder,
                          fontWeight: i <= 3 ? "bold" : "normal",
                          fontSize: "14px",
                          p: 0.5,
                          bgcolor:
                            i >= 6 && i <= 9
                              ? "#F3D01640"
                              : i >= 10 && i <= 13
                                ? "#4CAF503D"
                                : i >= 14 && i <= 15
                                  ? "#FF620040"
                                  : "white",
                        }}
                      >
                        {i === 3
                          ? row.label
                          : i === 6 && row.val
                            ? formatDecimal(row.val)
                            : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {contractsettlements.data.map(
                  (assignment: any, index: number) => (
                    <Fragment
                      key={
                        assignment?.assignmentCode?._id || `no_code_${index}`
                      }
                    >
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {index + 6}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                        />
                        <TableCell
                          align="center"
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {assignment?.assignmentCode?.deviceCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {assignment?.assignmentCode?.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...cellBorder,
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {assignment?.assignmentCode
                            ? assignment.assignmentCode.name
                            : "Vật tư không có định mức"}
                        </TableCell>
                        <TableCell
                          sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                        >
                          {assignment?.assignmentCode?.uom?.name}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                        >
                          {assignment?.assignmentCode
                            ? formattedPrice(assignment?.price)
                            : ""}
                        </TableCell>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <TableCell
                            key={i}
                            align="center"
                            sx={{
                              ...cellBorder,
                              fontSize: "14px",
                              p: 0.5,
                              bgcolor:
                                i >= 0 && i <= 3
                                  ? "#F3D01640"
                                  : i >= 4 && i <= 7
                                    ? "#4CAF503D"
                                    : "#FF620040",
                            }}
                          >
                            {i === 0
                              ? assignment?.assignmentCode
                                ? formatDecimal(assignment?.plan_Quantity)
                                : ""
                              : i === 3
                                ? assignment?.assignmentCode
                                  ? formattedPrice(assignment?.plan_Cost)
                                  : ""
                                : i === 4
                                  ? assignment?.assignmentCode
                                    ? formatDecimal(assignment?.used_Quantity)
                                    : ""
                                  : i === 7
                                    ? assignment?.assignmentCode
                                      ? formattedPrice(assignment?.used_Cost)
                                      : ""
                                    : i === 8
                                      ? assignment?.assignmentCode
                                        ? formatDecimal(
                                            assignment?.varianceQuantity,
                                          )
                                        : ""
                                      : i === 9
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
                        (materialUsed: any, i: number) => (
                          <TableRow key={materialUsed?._id || i}>
                            <TableCell
                              align="center"
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            />
                            <TableCell
                              align="center"
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            >
                              {materialUsed?.material?.code}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            />
                            <TableCell
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            />
                            <TableCell
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            >
                              {materialUsed?.material?.name}
                            </TableCell>
                            <TableCell
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            >
                              {materialUsed?.material?.uom?.name}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ ...cellBorder, fontSize: "14px", p: 0.5 }}
                            >
                              {assignment?.assignmentCode
                                ? ""
                                : formattedPrice(materialUsed?.price)}
                            </TableCell>
                            {Array.from({ length: 10 }).map((_, i2) => (
                              <TableCell
                                key={i2}
                                align="center"
                                sx={{
                                  ...cellBorder,
                                  fontSize: "14px",
                                  p: 0.5,
                                  bgcolor:
                                    i2 >= 0 && i2 <= 3
                                      ? "#F3D01640"
                                      : i2 >= 4 && i2 <= 7
                                        ? "#4CAF503D"
                                        : "#FF620040",
                                }}
                              >
                                {i2 === 0
                                  ? assignment?.assignmentCode
                                    ? ""
                                    : formatDecimal(materialUsed?.quantity)
                                  : i2 === 3
                                    ? assignment?.assignmentCode
                                      ? ""
                                      : formattedPrice(materialUsed?.cost)
                                    : i2 === 4
                                      ? formatDecimal(materialUsed?.quantity)
                                      : i2 === 7
                                        ? assignment?.assignmentCode
                                          ? ""
                                          : formattedPrice(materialUsed?.cost)
                                        : ""}
                              </TableCell>
                            ))}
                          </TableRow>
                        ),
                      )}
                    </Fragment>
                  ),
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
