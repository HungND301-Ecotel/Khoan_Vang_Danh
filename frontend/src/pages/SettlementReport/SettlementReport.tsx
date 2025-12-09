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

export default function SettlementReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs(new Date()).format('YYYY-MM'));
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedProductionScope, setSelectedProductionScope] = useState("");

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = [];

  for (let i = 0; i < 20; i++) {
    years.push(currentYear - i);
  }

  const { data: phasegroups = { data: [] } } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: () => api.get("/phasegroups").then((res) => res.data.data),
  });
  const { data: contractsettlements = [] } = useQuery({
    queryKey: ["contractsettlements", selectedMonth, selectedYear, selectedPhase, selectedProductionScope],
    queryFn: () =>
      api
        .get(
          `/contractsettlements/getMonth?month=${selectedMonth}&year=${selectedYear}&phase=${selectedPhase}&productionScope=${selectedProductionScope}`
        )
        .then((res) => res.data.data),
    enabled: !!selectedMonth && !!selectedYear && !!selectedPhase && !!selectedProductionScope,
  });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

  return (

    <Paper sx={{ width: 'calc(100vw - 148px)', overflowX: "auto", p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Box display={"flex"} gap={4} mt={2} sx={{
          justifyContent: { md: "space-between", xs: "flex-start" },
          flexDirection: { md: "row", xs: "column" },
        }}>
          <Box display={"flex"} gap={2}>
            <Grid container spacing={2} mb={3} alignItems="center">
              <Grid item xs={4}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                >
                  Chọn tháng
                </Typography>
                <FieldMonthYear selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
              </Grid>
              <Grid item xs={4}>
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
              <Grid item xs={4}>
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
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileDownload />}
              // onClick={handleExport}
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
                  boxShadow:
                    custom_theme.customShadows.tableFunctionalHover,
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
                  boxShadow:
                    custom_theme.customShadows.tableFunctionalHover,
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
      <Table sx={{ tableLayout: "auto", width: '100%', }} size="small">
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
              colSpan={13}
              sx={{
                border: "1px solid #ddd",
                fontWeight: "bold",
                bgcolor: "#F3D01640",
                fontSize: "0.75rem",
                p: 0.5,
              }}
            >
              Quyết toán giao khoán tháng {selectedMonth ? dayjs(selectedMonth).format('MM') : ''}
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
              colSpan={13}
              sx={{
                border: "1px solid #ddd",
                fontWeight: "bold",
                bgcolor: "#F3D01640",
                fontSize: "0.75rem",
                p: 0.5,
              }}
            >
              Khấu than
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
              colSpan={7}
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
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Chỉ tiêu hiện vật" : ""}
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
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Than nguyên khai" : ""}
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
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Mét lò đào" : ""}
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
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Mét lò xén" : ""}
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
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
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
              6
            </TableCell>
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Các chỉ tiêu vật tư" : ""}
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
              7
            </TableCell>
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Vật tư có định mức" : ""}
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
              8
            </TableCell>
            {Array.from({ length: 19 }).map((_, index) => (
              <TableCell
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  fontWeight: index <= 3 ? "bold" : "normal",
                  fontSize: "14px",
                  p: 0.5,
                  bgcolor:
                    index >= 6 && index <= 12
                      ? "#F3D01640"
                      : index >= 13 && index <= 16
                        ? "#4CAF503D"
                        : index >= 17 && index <= 18
                          ? "#FF620040"
                          : "white",
                }}
              >
                {index === 3 ? "Vật tư chủ yếu" : ""}
              </TableCell>
            ))}
          </TableRow>
          {contractsettlements.map(
            (assignment: any, index: number) => (
              <Fragment key={assignment?.assignmentCode?._id}>
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
                    {index + 9}
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
                    {assignment?.assignmentCode?.deviceCode?.code}
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
                    {assignment?.assignmentCode?.code}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      fontSize: "14px",
                      p: 0.5,
                    }}
                  >
                    {assignment?.assignmentCode?.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #ddd",
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
                    {assignment?.assignmentCode ? (assignment?.price || 0).toLocaleString() : ''}
                  </TableCell>
                  {Array.from({ length: 13 }).map((_, index) => (
                    <TableCell
                      key={index}
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor:
                          index >= 0 && index <= 6
                            ? "#F3D01640"
                            : index >= 7 && index <= 10
                              ? "#4CAF503D"
                              : index >= 11 && index <= 12
                                ? "#FF620040"
                                : "white",
                      }}
                    >
                      {index === 0
                        ? assignment?.assignmentCode ? assignment?.baseNorm : ''
                        : index === 1
                          ? assignment?.assignmentCode ? assignment?.adjustmentNorm : ''
                          : index === 2
                            ? assignment?.assignmentCode ? assignment?.norm : ''
                            : index === 3
                              ? assignment?.assignmentCode ? assignment?.plan_Quantity : ''
                              : index === 4
                                ? ""
                                : index === 5
                                  ? ""
                                  : index === 6
                                    ? assignment?.assignmentCode ? (assignment?.plan_Cost || 0).toLocaleString() : ''
                                    : index === 7
                                      ? assignment?.assignmentCode ? assignment?.used_Quantity?.toLocaleString() : ''
                                      : index === 8
                                        ? ""
                                        : index === 9
                                          ? ""
                                          : index === 10
                                            ? assignment?.assignmentCode ? assignment?.used_Cost?.toLocaleString() : ''
                                            : index === 11
                                              ? assignment?.assignmentCode ? (assignment?.varianceQuantity || 0).toLocaleString() : ''
                                              : index === 12
                                                ? assignment?.assignmentCode ? (assignment?.varianceCost || 0).toLocaleString() : ''
                                                : ""
                      }
                    </TableCell>
                  ))}
                </TableRow>
                {assignment?.materialUseds.map((materialUsed: any, i: number) => (
                  <TableRow key={materialUsed?._id}>
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        p: 0.5,
                      }}
                    >
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        p: 0.5,
                      }}
                    >{materialUsed?.material?.code}</TableCell>
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
                      {assignment?.assignmentCode?.device}
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
                    </TableCell>
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
                      {assignment?.assignmentCode ? '' : (materialUsed?.price || 0)?.toLocaleString()}
                    </TableCell>
                    {
                      Array.from({ length: 13 }).map((_, index) => (
                        <TableCell
                          key={index}
                          align="center"
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "normal",
                            fontSize: "14px",
                            p: 0.5,
                            bgcolor:
                              index >= 0 && index <= 6
                                ? "#F3D01640"
                                : index >= 7 && index <= 10
                                  ? "#4CAF503D"
                                  : index >= 11 && index <= 12
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
                                    ? ""
                                    : index === 5
                                      ? ""
                                      : index === 6
                                        ? ""
                                        : index === 7
                                          ? (materialUsed?.quantity || 0)?.toLocaleString()
                                          : index === 8
                                            ? ''
                                            : index === 9
                                              ? ""
                                              : index === 10
                                                ? assignment?.assignmentCode ? '' : (materialUsed?.cost || 0)?.toLocaleString()
                                                : index === 11
                                                  ? ''
                                                  : index === 12
                                                    ? ""
                                                    : ""
                          }
                        </TableCell>
                      ))
                    }
                  </TableRow>))}
              </Fragment>
            )
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
