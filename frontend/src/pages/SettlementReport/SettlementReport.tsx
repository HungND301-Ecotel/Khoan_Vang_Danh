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
} from "../../types";
import {
  ArrowDropDown,
  CalendarToday,
  FileDownload,
  Mail,
  Print,
} from "@mui/icons-material";
import custom_theme from "../../theme";

export default function SettlementReport() {
  const [selectedMonth, setSelectedMonth] = useState<Number>();
  const [selectedMaterialBudget, setSelectedMaterialBudget] = useState("");
  const [data, setData] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = [];

  for (let i = 0; i < 20; i++) {
    years.push(currentYear - i);
  }

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res) => res.data.data),
  });
  const { data: materialAssignments = [] } = useQuery({
    queryKey: ["materialassignments", selectedMonth, selectedYear],
    queryFn: () =>
      api
        .get(
          `/materialassignments/getFilter?month=${selectedMonth}&year=${selectedYear}`
        )
        .then((res) => res.data.data),
    enabled: !!selectedMonth && !!selectedYear,
  });

  const { data: materialBudgets = [] } = useQuery({
    queryKey: ["materialbudgets"],
    queryFn: () => api.get("/materialbudgets").then((res) => res.data.data),
  });
  const { data: materialBudget = null } = useQuery({
    queryKey: ["materialbudgets", selectedMaterialBudget],
    queryFn: () =>
      api
        .get(`/materialbudgets/getOne/${selectedMaterialBudget}`)
        .then((res) => setData(res.data.data)),
    enabled: !!selectedMaterialBudget,
  });

  const [tab, setTab] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                    >
                      Ngày bắt đầu
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Placeholder"
                      sx={{
                        width: 168,
                        height: 32,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "& fieldset": { borderColor: "#e0e0e0" },
                          "&:hover fieldset": { borderColor: "#bdbdbd" },
                        },
                      }}
                      select
                      value={selectedYear}
                      InputProps={{ endAdornment: <CalendarToday /> }}
                      SelectProps={{ IconComponent: () => null }}
                      onChange={(e) =>
                        setSelectedYear(parseInt(e.target.value))
                      }
                    >
                      {years.map((item, index) => (
                        <MenuItem key={index} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 500, color: "#333" }}
                    >
                      Ngày kết thúc
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Placeholder"
                      sx={{
                        width: 168,
                        height: 32,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "& fieldset": { borderColor: "#e0e0e0" },
                          "&:hover fieldset": { borderColor: "#bdbdbd" },
                        },
                      }}
                      select
                      InputProps={{ endAdornment: <CalendarToday /> }}
                      SelectProps={{ IconComponent: () => null }}
                      onChange={(e) =>
                        setSelectedMonth(parseInt(e.target.value))
                      }
                    >
                      {Array.from({ length: 12 }).map((_, index) => (
                        <MenuItem key={index} value={index + 1}>
                          {index + 1}
                        </MenuItem>
                      ))}
                    </TextField>
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
                      sx={{
                        width: 168,
                        height: 32,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "& fieldset": { borderColor: "#e0e0e0" },
                          "&:hover fieldset": { borderColor: "#bdbdbd" },
                        },
                      }}
                      select
                      variant="outlined"
                    >
                      {phases?.data?.map((item: PhaseOutputType) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name}
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
                    minWidth: 90,
                    height: 32,
                  }}
                >
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              boxShadow: "none",
              border: "1px solid #e0e0e0",
              mx: "auto",
              overflowX: "auto",
              "& .MuiTable-root": { tableLayout: "auto" },
              "& .MuiTableCell-root": {
                fontSize: "14px",
                fontWeight: "bold",
                py: { xs: 0.4, sm: 0.5 },
                px: { xs: 0.6, sm: 0.5 },
              },
            }}
          >
            <Table sx={{ width: "100%", tableLayout: "auto" }} size="small">
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT10" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT11" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
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
                      {index === 0 ? "GL01205VNMM" : ""}
                      {index === 1 ? "KT" : ""}
                      {index === 2 ? "KT12" : ""}
                      {index === 3 ? "Vật tư chủ yếu" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                {materialAssignments.map(
                  (material: MaterialAssignmentOutputType) => (
                    <Fragment key={material._id}>
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
                          <Checkbox size="small" />
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
                          {material.device}
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
                          {material.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            fontSize: "14px",
                            p: 0.5,
                          }}
                        >
                          {material.name}
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
                          {material.price
                            ? material.price.toLocaleString()
                            : ""}
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
                              ? data?.assignments.find(
                                (i: any) =>
                                  i._id.toString() ===
                                  material._id?.toString()
                              )?.assignmentNorm
                              : index === 1
                                ? data?.assignments.find(
                                  (i: any) =>
                                    i._id.toString() ===
                                    material._id?.toString()
                                )?.adjustmentNorm
                                : index === 2
                                  ? data?.assignments.find(
                                    (i: any) =>
                                      i._id.toString() ===
                                      material._id?.toString()
                                  )?.totalNorm
                                  : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                      {material.materials.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          >
                            <Checkbox size="small" />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          >
                            {m.code}
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
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          ></TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          >
                            {m.name}
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
                            {m.uom?.name}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid #ddd",
                              fontWeight: "normal",
                              fontSize: "14px",
                              p: 0.5,
                            }}
                          ></TableCell>
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
                            ></TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}
