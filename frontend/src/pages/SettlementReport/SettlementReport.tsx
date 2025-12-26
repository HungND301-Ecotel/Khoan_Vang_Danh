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
import { showErrorAlert } from "../../components/Alert";
import { parseAxiosError } from "../../utils/handleApiError";
import SettlementService from "../../service/SettlementRepotr";

export default function SettlementReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs(new Date()).format('YYYY-MM'));
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedProductionScope, setSelectedProductionScope] = useState("");

  const queryClient = useQueryClient();

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res) => res.data.data),
  });
  const { data: contractsettlements = { data: [], info: {} }, isLoading } = useQuery({
    queryKey: ["contractsettlements", selectedMonth, selectedPhase, selectedProductionScope],
    queryFn: () =>
      api
        .get(
          `/contractsettlements/getMonth?month=${selectedMonth}&phase=${selectedPhase}&productionScope=${selectedProductionScope}`
        )
        .then((res) => res.data.data),
    enabled: !!selectedMonth && !!selectedPhase,
  });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

  const exportExcel = useMutation({
    mutationFn: () => SettlementService.exportFile({
      month: selectedMonth,
      phase: selectedPhase,
      productionScope: selectedProductionScope
    }),
    onSuccess: () => { },
    onError: async (error: any) => {
      const message = await parseAxiosError(error);
      showErrorAlert(message);
    },
  });

  const isShow = (selectedPhase && selectedProductionScope)

  return (

    <Paper sx={{ width: 'calc(100vw - 148px)', p: 2 }}>
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
                  {phases?.data?.map((item: PhaseOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
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
              onClick={() => exportExcel.mutate()}
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
      <Box sx={{ overflowX: "auto", }}>
        <Table sx={{ tableLayout: "auto", width: '100%', }} size="small">
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
                Quyết toán giao khoán tháng {selectedMonth ? dayjs(selectedMonth).format('MM') : ''}
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
                {(contractsettlements.info?.phases || []).map((i: any) => i?.code).join(', ')}
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
                {(contractsettlements.info?.productionScopes || []).map((i: any) => i?.code).join(', ')}
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
              {isShow && <TableCell
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
              </TableCell>}
              {isShow && <TableCell
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
              </TableCell>}
              {isShow && <TableCell
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
              </TableCell>}
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
                        : index >= (isShow ? 14 : 11) && index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) && index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Than nguyên khai" : index === 8 ? (contractsettlements?.info.totalCoal ? Number(contractsettlements?.info.totalCoal.toFixed(1)).toLocaleString() : '') : ''}
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
                        : index >= (isShow ? 14 : 11) && index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) && index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Mét lò đào" : index === 8 ? (contractsettlements?.info.totalExcavation ? Number(contractsettlements?.info.totalExcavation.toFixed(1)).toLocaleString() : '') : ''}
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
                        : index >= (isShow ? 14 : 11) && index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) && index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Mét lò xén" : index === 8 ? (contractsettlements?.info.totalCutting ? Number(contractsettlements?.info.totalCutting.toFixed(1)).toLocaleString() : '') : ''}
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
                        : index >= (isShow ? 14 : 11) && index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) && index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Tỉ lệ đá lẫn trong gương (Ckep)" : index === 8 ? contractsettlements.info?.rockRatio : ''}
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
                        : index >= (isShow ? 14 : 11) && index <= (isShow ? 17 : 14)
                          ? "#4CAF503D"
                          : index >= (isShow ? 18 : 15) && index <= (isShow ? 19 : 16)
                            ? "#FF620040"
                            : "white",
                  }}
                >
                  {index === 4 ? "Vật tư có định mức" : ''}
                </TableCell>
              ))}
            </TableRow>
            {contractsettlements.data.map(
              (assignment: any, index: number) => (
                <Fragment key={(assignment?.assignmentCode||assignment.assignmentCode===null)?._id}>
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
                      {(assignment?.assignmentCode||assignment.assignmentCode===null)?.code}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                        fontSize: "14px",
                        p: 0.5,
                      }}
                    >
                      {(assignment?.assignmentCode||assignment.assignmentCode===null)?(assignment?.assignmentCode?.name||'Không xác định') : 'Vật tư không có định mức'}
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
                      {(assignment?.assignmentCode||assignment.assignmentCode===null) ? (assignment?.price ? (Number(assignment?.price.toFixed(0))).toLocaleString() : '') : ''}
                    </TableCell>
                    {isShow && <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640"
                      }}
                    >
                      {(assignment?.assignmentCode||assignment.assignmentCode===null) ? (assignment?.baseNorm ? (Number(assignment?.baseNorm.toFixed(3))).toLocaleString() : '') : ''}
                    </TableCell>}
                    {isShow && <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640"
                      }}
                    >
                      {(assignment?.assignmentCode||assignment.assignmentCode===null) ? (assignment?.adjustmentNorm ? (Number(assignment?.adjustmentNorm.toFixed(3))).toLocaleString() : '') : ''}
                    </TableCell>}
                    {isShow && <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ddd",
                        fontWeight: "normal",
                        fontSize: "14px",
                        p: 0.5,
                        bgcolor: "#F3D01640"
                      }}
                    >
                      {(assignment?.assignmentCode||assignment.assignmentCode===null) ? (assignment?.norm ? (Number(assignment?.norm.toFixed(3))).toLocaleString() : '') : ''}
                    </TableCell>}
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
                          ? assignment?.assignmentCode ? (Number(assignment?.plan_Quantity.toFixed(1))).toLocaleString() : ''
                          : index === 1
                            ? ""
                            : index === 2
                              ? ""
                              : index === 3
                                ? assignment?.assignmentCode ? (assignment?.plan_Cost ? (Number(assignment?.plan_Cost.toFixed(0))).toLocaleString() : "") : ''
                                : index === 4
                                  ? assignment?.assignmentCode ? (assignment?.used_Quantity ? (Number(assignment?.used_Quantity.toFixed(1))).toLocaleString() : '') : ''
                                  : index === 5
                                    ? ""
                                    : index === 6
                                      ? ""
                                      : index === 7
                                        ? assignment?.assignmentCode ? (assignment?.used_Cost ? (Number(assignment?.used_Cost.toFixed(0))).toLocaleString() : '') : ''
                                        : index === 8
                                          ? assignment?.assignmentCode ? (assignment?.varianceQuantity ? (Number(assignment?.varianceQuantity.toFixed(1))).toLocaleString() : '') : ''
                                          : index === 9
                                            ? assignment?.assignmentCode ? (assignment?.varianceCost ? (Number(assignment?.varianceCost.toFixed(0))).toLocaleString() : '') : ''
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
                        {(assignment?.materialUseds || []).filter((mat: any) => mat.material?._id === materialUsed?.material?._id)?.length || 1}
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
                        {(assignment?.assignmentCode||assignment.assignmentCode===null) ? '' : (materialUsed?.price ? (Number(materialUsed?.price.toFixed(0)))?.toLocaleString() : '')}
                      </TableCell>
                      {isShow && <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "normal",
                          fontSize: "14px",
                          p: 0.5,
                          bgcolor: "#F3D01640"
                        }}
                      >

                      </TableCell>}
                      {isShow && <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "normal",
                          fontSize: "14px",
                          p: 0.5,
                          bgcolor: "#F3D01640"
                        }}
                      >
                      </TableCell>}
                      {isShow && <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ddd",
                          fontWeight: "normal",
                          fontSize: "14px",
                          p: 0.5,
                          bgcolor: "#F3D01640"
                        }}
                      >
                      </TableCell>}
                      {
                        Array.from({ length: 10 }).map((_, index) => (
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
                              ? ''
                              : index === 1
                                ? ""
                                : index === 2
                                  ? ""
                                  : index === 3
                                    ? ""
                                    : index === 4
                                      ? (materialUsed?.quantity ? Number(materialUsed?.quantity.toFixed(1))?.toLocaleString() : '')
                                      : index === 5
                                        ? ''
                                        : index === 6
                                          ? ""
                                          : index === 7
                                            ? assignment?.assignmentCode ? '' : (materialUsed?.cost ? Number(materialUsed?.cost.toFixed(0))?.toLocaleString() : '')
                                            : index === 8
                                              ? ''
                                              : index === 9
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
      </Box>
    </Paper >
  );
}
