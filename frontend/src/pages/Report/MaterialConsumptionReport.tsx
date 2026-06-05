import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Button,
  Box,
  MenuItem,
  Grid,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import api from "../../config/api.config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FieldMonthYear from "../../ui/FieldMonth_Year";
import { PhaseOutputType, ProductionScopeOutputType } from "../../types";
import dayjs from "dayjs";
import SettlementService from "../../service/SettlementRepotr";
import { parseAxiosError } from "../../utils/handleApiError";
import { showErrorAlert } from "../../components/Alert";

export default function MaterialConsumptionReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs(new Date()).format("YYYY-MM"),
  );
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedProductionScope, setSelectedProductionScope] = useState("");

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
      enabled: !!selectedMonth && !!selectedPhase,
    });

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: () => api.get("/productionscopes").then((res) => res.data.data),
  });

  const exportExcel = useMutation({
    mutationFn: () =>
      SettlementService.exportFileM3({
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

  return (
    <Paper sx={{ p: 3, width: "100%", boxSizing: "border-box" }}>
      <Button
        variant="contained"
        onClick={() => exportExcel.mutate()}
        startIcon={<FileDownloadIcon />}
        sx={{ mb: 2 }}
      >
        Xuất file Excel
      </Button>
      <Box display={"flex"} gap={2}>
        <Grid container spacing={2} mb={3} alignItems="center">
          <Grid item xs={4}>
            <Typography
              variant="body2"
              sx={{ mb: 1, fontWeight: 500, color: "#333" }}
            >
              Chọn tháng
            </Typography>
            <FieldMonthYear
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
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
                backgroundColor: "#fff",
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
                backgroundColor: "#fff",
              }}
              select
              variant="outlined"
            >
              {productionscopes?.data?.map(
                (item: ProductionScopeOutputType) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.code}
                  </MenuItem>
                ),
              )}
            </TextField>
          </Grid>
        </Grid>
      </Box>
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ textAlign: "center", mb: 1 }}
      >
        BÁO CÁO THỰC HIỆN ĐM VẬT TƯ THEO PHÂN XƯỞNG
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          overflowX: "auto",
          border: "1px solid #e0e0e0",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#ccc", borderRadius: 8 },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            {/* Hàng tiêu đề 1 */}
            <TableRow sx={{ backgroundColor: "#e0f0ff" }}>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Mã giao khoán
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ minWidth: 300, border: "1px solid #a8a8a4ff" }}
              >
                Tên vật tư, tài sản
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                ĐVT
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ minWidth: 100, border: "1px solid #a8a8a4ff" }}
              >
                Đơn giá (VNĐ)
              </TableCell>

              <TableCell
                colSpan={9}
                align="center"
                sx={{ minWidth: 100, border: "1px solid #a8a8a4ff" }}
              >
                {(contractsettlements.info?.productionScopes || [])
                  .map((i: any) => i?.code)
                  .join(", ") +
                  " " +
                  (contractsettlements.info?.phases || [])
                    .map((i: any) => i?.code)
                    .join(", ")}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Khối lượng
              </TableCell>
              <TableCell
                colSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Kế hoạch
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Thực hiện
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                So sánh
              </TableCell>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
            {/* Hàng tiêu đề 2 */}
            <TableRow sx={{ backgroundColor: "#e0f0ff" }}>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                {contractsettlements.info.totalCoal ||
                  contractsettlements.info.totalCutting ||
                  contractsettlements.info.totalExcavation}
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                ĐM
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contractsettlements.data.map((assignment: any) => (
              <>
                <TableRow key={assignment.id}>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", border: "1px solid #a8a8a4ff" }}
                  >
                    {assignment?.assignmentCode?.code}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #a8a8a4ff" }}>
                    {" "}
                    {assignment?.assignmentCode &&
                    assignment.assignmentCode !== null
                      ? assignment?.assignmentCode?.name
                      : "Vật tư không có định mức"}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #a8a8a4ff" }}
                  >
                    {assignment?.assignmentCode?.uom?.name}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #a8a8a4ff" }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.price
                        ? Number(assignment?.price.toFixed(0)).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #a8a8a4ff" }}
                  ></TableCell>
                  {/* 1. Kế hoạch */}
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #a8a8a4ff" }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.norm
                        ? Number(assignment?.norm.toFixed(3)).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "blue",
                      border: "1px solid #a8a8a4ff",
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? Number(
                          assignment?.plan_Quantity.toFixed(1),
                        ).toLocaleString()
                      : ""}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #a8a8a4ff" }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.plan_Cost
                        ? Number(
                            assignment?.plan_Cost.toFixed(0),
                          ).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>
                  {/* 2. Thực hiện */}
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "green",
                      border: "1px solid #a8a8a4ff",
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.used_Quantity
                        ? Number(
                            assignment?.used_Quantity.toFixed(1),
                          ).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "red",
                      border: "1px solid #a8a8a4ff",
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.used_Cost
                        ? Number(
                            assignment?.used_Cost.toFixed(1),
                          ).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>

                  {/* 3. So sánh (Chỉ hiển thị) */}
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "orange",
                      border: "1px solid #a8a8a4ff",
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.varianceQuantity
                        ? Number(
                            assignment?.varianceQuantity.toFixed(1),
                          ).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "red",
                      border: "1px solid #a8a8a4ff",
                    }}
                  >
                    {assignment?.assignmentCode ||
                    assignment.assignmentCode === null
                      ? assignment?.varianceCost
                        ? Number(
                            assignment?.varianceCost.toFixed(0),
                          ).toLocaleString()
                        : ""
                      : ""}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: "red",
                      border: "1px solid #a8a8a4ff",
                    }}
                  ></TableCell>
                </TableRow>
                {!(
                  assignment?.assignmentCode ||
                  assignment.assignmentCode === null
                ) &&
                  assignment?.materialUseds.map(
                    (materialUsed: any, i: number) => (
                      <TableRow>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        >
                          {materialUsed?.material?.code}
                        </TableCell>
                        <TableCell sx={{ border: "1px solid #a8a8a4ff" }}>
                          {materialUsed?.material?.name}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        >
                          {materialUsed?.material?.uom?.name}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        >
                          {materialUsed?.price
                            ? Number(
                                materialUsed?.price.toFixed(0),
                              ).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        >
                          {materialUsed?.quantity
                            ? Number(
                                materialUsed?.quantity.toFixed(1),
                              ).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        >
                          {materialUsed?.cost
                            ? Number(
                                materialUsed?.cost.toFixed(0),
                              ).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            border: "1px solid #a8a8a4ff",
                          }}
                        ></TableCell>
                      </TableRow>
                    ),
                  )}
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
