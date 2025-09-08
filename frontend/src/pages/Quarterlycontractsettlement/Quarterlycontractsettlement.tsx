import {
  Box,
  Button,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialAssignmentOutputType } from "../../types";
import { ArrowDropDown, FileDownload, Mail, Print } from "@mui/icons-material";

const api = {
  get: (url: string) => Promise.resolve({ data: { data: [] } }),
};

export default function Quarterlycontractsettlement() {
  const [selectedQuarter, setSelectedQuarter] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedmaterialBudget, setSelectedmaterialBudget] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const { data: phases = [] } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res: any) => res.data.data),
  });

  const { data: materialassignments = [] } = useQuery({
    queryKey: ["materialassignments", selectedQuarter, selectedYear],
    queryFn: () =>
      api
        .get(
          `/materialassignments/getFilter?quarter=${selectedQuarter}&year=${selectedYear}`
        )
        .then((res: any) => res.data.data),
    enabled: !!selectedQuarter && !!selectedYear,
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

  const handleExport = () => {
    console.log("Export file");
  };

  const handlePrint = () => {
    console.log("Print");
  };

  const handleSend = () => {
    console.log("Send");
  };

  return (
    <Paper elevation={3} style={{ padding: 16, width: "100%" }}>
      <Box mb={3}>
        <Grid container spacing={3} alignItems="end" mb={3}>
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

          <Grid item xs={6}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileDownload />}
                sx={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Xuất file
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Print />}
                sx={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                In
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Mail />}
                endIcon={<ArrowDropDown />}
                sx={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Gửi
              </Button>
            </Box>
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
            {[1, 2, 3].map((index) => (
              <TableRow key={index}>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #ccc", p: 1 }}
                >
                  {index}
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
                      {index + 4}
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
                        {index + 4}.{mIndex + 1}
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
