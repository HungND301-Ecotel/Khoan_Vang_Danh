import {
  Box,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Add this import
import { MaterialAssignmentOutputType } from "../../types";

const api = {
  get: (url: string) => Promise.resolve({ data: { data: [] } }),
};

export default function Quarterlycontractsettlement() {
  const [selectedMonth, setSelectedMonth] = useState<number>(); // Changed Number to number
  const [selectedmaterialBudget, setSelectedmaterialBudget] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = [];

  for (let i = 0; i < 20; i++) {
    years.push(currentYear - i);
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const { data: phases = [] } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res: any) => res.data.data),
  });

  const { data: materialassignments = [] } = useQuery({
    queryKey: ["materialassignments", selectedMonth, selectedYear],
    queryFn: () =>
      api
        .get(
          `/materialassignments/getFilter?month=${selectedMonth}&year=${selectedYear}`
        )
        .then((res: any) => res.data.data),
    enabled: !!selectedMonth && !!selectedYear,
  });

  const { data: materialbudgets = [] } = useQuery({
    queryKey: ["materialbudgets"],
    queryFn: () =>
      api.get("/materialbudgets").then((res: any) => res.data.data),
  });

  const { data: materialbudget = null } = useQuery({
    queryKey: ["materialbudgets", selectedmaterialBudget],
    queryFn: () =>
      api
        .get(`/materialbudgets/getOne/${selectedmaterialBudget}`)
        .then((res: any) => setData(res.data.data)),
    enabled: !!selectedmaterialBudget,
  });

  return (
    <Paper elevation={3} style={{ padding: 16, width: "100%" }}>
      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" >Quyết toán giao khoán</Typography>
      </Box> */}
      <Box mb={3} gap={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              select
              label="Chọn Quý"
              placeholder="Placeholder"
              size="small"
            >
              <MenuItem value="">Placeholder</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#f5f5f5",
          width: "100%",
          border: "1px solid #ddd",
        }}
      >
        <Table sx={{ width: "100%" }} size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#e8f4f8" }}>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  minWidth: 60,
                }}
              >
                STT
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  minWidth: 120,
                }}
              >
                Mã vật tư
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  minWidth: 200,
                }}
              >
                Tên vật tư, tài sản
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  minWidth: 80,
                }}
              >
                ĐVT
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  minWidth: 100,
                }}
              >
                Đơn giá khoán
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  backgroundColor: "#fff3cd",
                }}
              >
                Kế hoạch
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  backgroundColor: "#d1ecf1",
                }}
              >
                Thực hiện
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  backgroundColor: "#f8d7da",
                }}
              >
                So sánh lãi (+); lỗ (-)
              </TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: "#e8f4f8" }}>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>

              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#fff3cd",
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#fff3cd",
                }}
              >
                Giá trị
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#d1ecf1",
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#d1ecf1",
                }}
              >
                Giá trị
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#f8d7da",
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  backgroundColor: "#f8d7da",
                }}
              >
                Giá trị
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Sample data rows */}
            {[0, 1, 2].map((index) => (
              <TableRow key={index}>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1 }}
                >
                  <Checkbox size="small" />
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  GL01158VNMM
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1, fontSize: "0.85rem" }}
                >
                  0
                </TableCell>
              </TableRow>
            ))}
            {(materialassignments as MaterialAssignmentOutputType[]).map(
              (material: MaterialAssignmentOutputType, index: number) => (
                <Fragment key={material._id}>
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{ border: "1px solid #ccc", p: 1 }}
                    >
                      <Checkbox size="small" />
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        color: "blue",
                        fontSize: "0.85rem",
                        p: 1,
                      }}
                    >
                      {material.code}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        p: 1,
                      }}
                    >
                      {material.name}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        p: 1,
                      }}
                    >
                      {material.uom}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        color: "blue",
                        fontSize: "0.85rem",
                        p: 1,
                      }}
                    >
                      {material.price ? material.price.toLocaleString() : "0"}
                    </TableCell>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        align="center"
                        sx={{
                          border: "1px solid #ccc",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          p: 1,
                        }}
                      >
                        {cellIndex === 0
                          ? data?.assignments?.find(
                              (i: any) =>
                                i._id.toString() === material._id?.toString()
                            )?.assignmentNorm || "0"
                          : cellIndex === 1
                          ? data?.assignments?.find(
                              (i: any) =>
                                i._id.toString() === material._id?.toString()
                            )?.adjustmentNorm || "0"
                          : cellIndex === 2
                          ? data?.assignments?.find(
                              (i: any) =>
                                i._id.toString() === material._id?.toString()
                            )?.totalNorm || "0"
                          : "0"}
                      </TableCell>
                    ))}
                  </TableRow>
                  {material.materials?.map((m: any, mIndex: number) => (
                    <TableRow key={`${material._id}-${mIndex}`}>
                      <TableCell
                        align="center"
                        sx={{ border: "1px solid #ccc", p: 1 }}
                      >
                        <Checkbox size="small" />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ccc",
                          fontSize: "0.85rem",
                          p: 1,
                        }}
                      >
                        {m.code}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: "1px solid #ccc",
                          fontSize: "0.85rem",
                          p: 1,
                        }}
                      >
                        {m.name}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ccc",
                          fontSize: "0.85rem",
                          p: 1,
                        }}
                      >
                        {m.uom?.name}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: "1px solid #ccc",
                          fontSize: "0.85rem",
                          p: 1,
                        }}
                      >
                        {m.currentPrice ? m.currentPrice.toLocaleString() : "0"}
                      </TableCell>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          align="center"
                          sx={{
                            border: "1px solid #ccc",
                            fontSize: "0.85rem",
                            p: 1,
                          }}
                        >
                          0
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
