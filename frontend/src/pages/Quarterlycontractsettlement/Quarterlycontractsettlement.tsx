import React, { Fragment, useState } from "react";
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
} from "@mui/icons-material";
import custom_theme from "../../theme";
import FieldMonthYear from "../../ui/FieldMonth_Year";
import dayjs from "dayjs";
import SettlementService from "../../service/SettlementRepotr";
import { parseAxiosError } from "../../utils/handleApiError";
import { showErrorAlert } from "../../components/Alert";
import { formatDecimal, formattedPrice } from "../../utils/helpers";

export default function Quarterlycontractsettlement() {
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedProductionScope, setSelectedProductionScope] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(1);

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = [];

  for (let i = 0; i < 20; i++) {
    years.push(currentYear - i);
  }

  const quarters = [
    { value: 1, label: "Quý 1" },
    { value: 2, label: "Quý 2" },
    { value: 3, label: "Quý 3" },
    { value: 4, label: "Quý 4" },
  ];

  const { data: contractsettlements = { data: [], info: {} } } = useQuery({
    queryKey: ["contractsettlements", selectedQuarter, selectedYear],
    queryFn: () =>
      api
        .get(
          `/contractsettlements/getQuarter?quarter=${selectedQuarter}&year=${selectedYear}&phase=${selectedPhase}&productionScope=${selectedProductionScope}`,
        )
        .then((res) => res.data.data),
    enabled: !!selectedQuarter && !!selectedYear,
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

  return (
    <Paper sx={{ width: "calc(100vw - 148px)", p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Grid container spacing={2} mb={3} alignItems="center">
              <Grid item xs={3}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                >
                  Chọn quý
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={selectedQuarter || ""}
                  onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                  size="small"
                >
                  {quarters.map((quarter) => (
                    <MenuItem key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                >
                  Chọn năm
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  size="small"
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* <Grid item xs={3}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                >
                  Chọn công đoạn
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Placeholder"
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  sx={{
                    // width: 168,
                    // height: 32,
                    // "& .MuiOutlinedInput-root": {
                    //   backgroundColor: "#f8f9fa",
                    //   "& fieldset": { borderColor: "#e0e0e0" },
                    //   "&:hover fieldset": { borderColor: "#bdbdbd" },
                    // },
                    backgroundColor: '#fff'
                  }}
                  select
                  variant="outlined"
                >
                  {phasegroups?.data?.map((item: PhaseOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                >
                  Chọn diện sản xuất
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Placeholder"
                  onChange={(e) => setSelectedProductionScope(e.target.value)}
                  sx={{
                    // width: 168,
                    // height: 32,
                    // "& .MuiOutlinedInput-root": {
                    //   backgroundColor: "#f8f9fa",
                    //   "& fieldset": { borderColor: "#e0e0e0" },
                    //   "&:hover fieldset": { borderColor: "#bdbdbd" },
                    // },
                    backgroundColor: '#fff'
                  }}
                  select
                  variant="outlined"
                >
                  {productionscopes?.data?.map((item: ProductionScopeOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))}
                </TextField> 
              </Grid>*/}
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
      <Box sx={{ overflowX: "auto", transform: "rotateX(180deg)" }}>
        <Table sx={{ tableLayout: "auto", width: "100%", transform: "rotateX(180deg)" }} size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                colSpan={7}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

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
                colSpan={7}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

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
                colSpan={7}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  p: 0.5,
                }}
              ></TableCell>

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
            {contractsettlements.data.map((assignment: any, index: number) => (
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
                                            : formattedPrice(materialUsed?.cost)
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
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
