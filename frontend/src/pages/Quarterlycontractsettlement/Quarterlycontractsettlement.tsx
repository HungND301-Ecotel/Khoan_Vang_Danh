import React, { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Box,
  MenuItem,
  Grid,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import SettlementService from "../../service/SettlementRepotr";
import { parseAxiosError } from "../../utils/handleApiError";
import { showErrorAlert } from "../../components/Alert";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import FieldAutoCompleted from "../../components/TextField/FieldAutoCompleted";

export default function Quarterlycontractsettlement() {
  const [selectedQuarter, setSelectedQuarter] = useState("1");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const years = [];

  for (let i = 0; i < 20; i++) {
    years.push({ _id: currentYear - i, label: currentYear - i });
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
  const { data: contractsettlements = { data: [], info: {} } } = useQuery({
    queryKey: [
      "contractsettlements",
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
      SettlementService.exportFile({
        quarter: selectedQuarter,
        year: selectedYear,
      }),
    onSuccess: () => {},
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

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

    if (tableRef.current) {
      observer.observe(tableRef.current);
    }
    if (tableContainerRef.current) {
      observer.observe(tableContainerRef.current);
    }

    updateWidth(); // initial update

    return () => observer.disconnect();
  }, [contractsettlements]);

  const theadRef = React.useRef<HTMLTableSectionElement>(null);

  // JS-based sticky header for window scrolling
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

  return (
    <Paper sx={{ width: "calc(100vw - 154px)", p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container spacing={2} mb={3} alignItems="center">
              <Grid item xs={4}>
                <FieldAutoCompleted
                  data={departments?.data || []}
                  value={selectedDepartment}
                  setValue={setSelectedDepartment}
                  title="Chọn phân xưởng"
                  labelkey="name"
                />
              </Grid>
              <Grid item xs={4}>
                <FieldAutoCompleted
                  data={quarters}
                  value={selectedQuarter}
                  setValue={setSelectedQuarter}
                  title="Chọn quý"
                  labelkey="label"
                />
              </Grid>
              <Grid item xs={4}>
                <FieldAutoCompleted
                  data={years}
                  value={selectedYear}
                  setValue={setSelectedYear}
                  title="Chọn năm"
                  labelkey="label"
                />
              </Grid>
            </Grid>
          </Grid>
          {/* <Grid
            item
            xs={6}
            alignItems="center"
            justifyContent="flex-end"
            display="flex"
          >
            <Box display="flex" gap={2}>
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
          </Grid> */}
        </Grid>
      </Box>
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
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
            position: "sticky",
            top: 100, // Cố định thanh cuộn ngang vào trình duyệt
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
            // overflowY: "auto",
            width: "100%",
            // maxHeight: "65vh",
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
              <TableRow>
                <TableCell
                  align="center"
                  rowSpan={5}
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
                  rowSpan={5}
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
                  rowSpan={5}
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
                  rowSpan={5}
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
                  rowSpan={5}
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
                  rowSpan={5}
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
                  rowSpan={5}
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

                <TableCell
                  align="center"
                  colSpan={10}
                  sx={{
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                    bgcolor: "#F3D01640",
                    fontSize: "0.75rem",
                    p: 0.5,
                  }}
                >
                  Quyết toán giao khoán quý {selectedQuarter} năm {selectedYear}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={10}
                  sx={{
                    border: "1px solid #ddd",
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
                {Array.from({ length: 16 }).map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: index <= 3 ? "bold" : "normal",
                      fontSize: "14px",
                      p: 0.5,
                      bgcolor:
                        index >= 6 && index <= 9
                          ? "#F3D01640"
                          : index >= 10 && index <= 13
                            ? "#4CAF503D"
                            : index >= 14 && index <= 15
                              ? "#FF620040"
                              : "white",
                    }}
                  >
                    {index === 3
                      ? "Than nguyên khai"
                      : index === 6
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
                {Array.from({ length: 16 }).map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: index <= 3 ? "bold" : "normal",
                      fontSize: "14px",
                      p: 0.5,
                      bgcolor:
                        index >= 6 && index <= 9
                          ? "#F3D01640"
                          : index >= 10 && index <= 13
                            ? "#4CAF503D"
                            : index >= 14 && index <= 15
                              ? "#FF620040"
                              : "white",
                    }}
                  >
                    {index === 3
                      ? "Mét lò đào"
                      : index === 6
                        ? formatDecimal(
                            contractsettlements?.info.totalExcavation,
                          )
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
                {Array.from({ length: 16 }).map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: index <= 3 ? "bold" : "normal",
                      fontSize: "14px",
                      p: 0.5,
                      bgcolor:
                        index >= 6 && index <= 9
                          ? "#F3D01640"
                          : index >= 10 && index <= 13
                            ? "#4CAF503D"
                            : index >= 14 && index <= 15
                              ? "#FF620040"
                              : "white",
                    }}
                  >
                    {index === 3
                      ? "Mét lò xén"
                      : index === 6
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
                {Array.from({ length: 16 }).map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: index <= 3 ? "bold" : "normal",
                      fontSize: "14px",
                      p: 0.5,
                      bgcolor:
                        index >= 6 && index <= 9
                          ? "#F3D01640"
                          : index >= 10 && index <= 13
                            ? "#4CAF503D"
                            : index >= 14 && index <= 15
                              ? "#FF620040"
                              : "white",
                    }}
                  >
                    {index === 3 ? "Tỉ lệ đá lẫn trong gương (Ckep)" : ""}
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
                {Array.from({ length: 16 }).map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: index <= 3 ? "bold" : "normal",
                      fontSize: "14px",
                      p: 0.5,
                      bgcolor:
                        index >= 6 && index <= 9
                          ? "#F3D01640"
                          : index >= 10 && index <= 13
                            ? "#4CAF503D"
                            : index >= 14 && index <= 15
                              ? "#FF620040"
                              : "white",
                    }}
                  >
                    {index === 3 ? "Vật tư có định mức" : ""}
                  </TableCell>
                ))}
              </TableRow>
              {contractsettlements.data.map(
                (assignment: any, index: number) => (
                  <Fragment
                    key={
                      (
                        assignment?.assignmentCode ||
                        assignment.assignmentCode === null
                      )?._id
                    }
                  >
                    <TableRow>
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
                      >
                        {
                          (
                            assignment?.assignmentCode ||
                            assignment.assignmentCode === null
                          )?.deviceCode?.code
                        }
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
                        {
                          (
                            assignment?.assignmentCode ||
                            assignment.assignmentCode === null
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
                        sx={{
                          border: "1px solid #ddd",
                          fontSize: "14px",
                          p: 0.5,
                        }}
                      >
                        {
                          (
                            assignment?.assignmentCode ||
                            assignment.assignmentCode === null
                          )?.uom?.name
                        }
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
                        assignment.assignmentCode === null
                          ? formattedPrice(assignment?.price)
                          : ""}
                      </TableCell>
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
                              ? assignment?.assignmentCode
                                ? formatDecimal(assignment?.plan_InNormQuantity)
                                : ""
                              : index === 2
                                ? assignment?.assignmentCode &&
                                  assignment?.plan_ExtraQuantity > 0
                                  ? formatDecimal(
                                      assignment?.plan_ExtraQuantity,
                                    )
                                  : ""
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
                                            ? formattedPrice(
                                                assignment?.used_Cost,
                                              )
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
                      (materialUsed: any, i: number) => (
                        <TableRow key={materialUsed?._id}>
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
                            {
                              (
                                assignment?.assignmentCode ||
                                assignment.assignmentCode === null
                              )?.device
                            }
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
                            sx={{
                              border: "1px solid #ddd",
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          >
                            {materialUsed?.material?.name}
                          </TableCell>
                          <TableCell
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
                            {assignment?.assignmentCode
                              ? ""
                              : formattedPrice(materialUsed?.price)}
                          </TableCell>
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
                                  ? ""
                                  : formatDecimal(materialUsed?.quantity)
                                : index === 1
                                  ? ""
                                  : index === 2
                                    ? ""
                                    : index === 3
                                      ? assignment?.assignmentCode
                                        ? ""
                                        : formattedPrice(materialUsed?.cost)
                                      : index === 4
                                        ? formatDecimal(materialUsed?.quantity)
                                        : index === 5
                                          ? ""
                                          : index === 6
                                            ? ""
                                            : index === 7
                                              ? assignment?.assignmentCode
                                                ? ""
                                                : formattedPrice(
                                                    materialUsed?.cost,
                                                  )
                                              : index === 8
                                                ? assignment?.assignmentCode
                                                  ? ""
                                                  : formatDecimal(0)
                                                : index === 9
                                                  ? assignment?.assignmentCode
                                                    ? ""
                                                    : formattedPrice(0)
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
    </Paper>
  );
}
