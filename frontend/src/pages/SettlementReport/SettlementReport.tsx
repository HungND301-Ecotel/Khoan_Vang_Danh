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
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  MaterialAssignmentOutputType,
  MaterialBudgetInputType,
  PhaseOutputType,
} from "../../types";

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

  const { data: phases = [] } = useQuery({
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
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Ngày bắt đầu
                    </Typography>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 240 }}
                      select
                      value={selectedYear}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        },
                      }}
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
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Ngày kết thúc
                    </Typography>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 240 }}
                      select
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        },
                      }}
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
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Chọn công đoạn
                    </Typography>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 240 }}
                      select
                      variant="outlined"
                    >
                      {phases?.map((item: PhaseOutputType) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>

          {/* Phần hiển thị bảng */}
          <TableContainer component={Paper}>
            <Table sx={{ width: "100%" }}>
              <TableHead>
                {/* Hàng 1 */}
                <TableRow>
                  <TableCell
                    align="center"
                    colSpan={7}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    {/* Ô trống */}
                  </TableCell>

                  <TableCell
                    align="center"
                    colSpan={7}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Kế hoạch
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={4}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Thực hiện
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={4}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#FF620040",
                    }}
                  >
                    So sánh lãi(+); lỗ(-)
                  </TableCell>
                </TableRow>

                {/* Hàng 2 */}
                <TableRow>
                  {/* Bên trái */}
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    STT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    Mã vật tư
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    Mã thiết bị
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    Mã giao khoán
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    Tên vật tư, tài sản
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    ĐVT
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{ border: "1px solid black", fontWeight: "bold" }}
                  >
                    Đơn giá khoán
                  </TableCell>

                  {/* Kế hoạch */}
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Định mức gốc
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Hệ số điều chỉnh định mức
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Định mức
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={3}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Số lượng
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Giá trị
                  </TableCell>

                  {/* Thực hiện */}
                  <TableCell
                    align="center"
                    colSpan={3}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Số lượng
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Giá trị
                  </TableCell>

                  {/* So sánh lãi lỗ */}
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#FF620040",
                    }}
                  >
                    Số lượng
                  </TableCell>
                  <TableCell
                    align="center"
                    rowSpan={2}
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#FF620040",
                    }}
                  >
                    Giá trị
                  </TableCell>
                </TableRow>

                {/* Hàng 3 */}
                <TableRow>
                  {/* Số lượng kế hoạch */}
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Tổng
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Trong khoán
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#F3D01640",
                    }}
                  >
                    Ngoài khoán
                  </TableCell>

                  {/* Số lượng thực hiện */}
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Tổng
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Trong khoán
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      border: "1px solid black",
                      fontWeight: "bold",
                      bgcolor: "#4CAF503D",
                    }}
                  >
                    Ngoài khoán
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Chỉ tiêu hiện vật" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Than nguyên khai" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Mét lò đào" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Mét lò xén" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Tỉ lệ đá lẫn trong gương (Ckep)" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Các chỉ tiêu vật tư" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Vật tư có định mức" : ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {Array.from({ length: 20 }).map((_, index) => (
                    <TableCell
                      sx={{
                        border: "1px solid black",
                        fontWeight: "bold",
                        bgcolor:
                          index >= 7 && index <= 13
                            ? "#F3D01640"
                            : index >= 14 && index <= 17
                            ? "#4CAF503D"
                            : index >= 18 && index <= 20
                            ? "#FF620040"
                            : "white",
                      }}
                    >
                      {index === 4 ? "Vật tư chủ yếu" : ""}
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
                            border: "1px solid black",
                            fontWeight: "bold",
                            bgcolor: "#F3D01640",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                          }}
                        ></TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                            color: "blue",
                          }}
                        >
                          {material.device}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                            color: "blue",
                          }}
                        >
                          {material.code}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                            bgcolor: "#F3D01640",
                          }}
                        >
                          {material.name}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                            bgcolor: "#F3D01640",
                          }}
                        >
                          {material.uom}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1px solid black",
                            fontWeight: "bold",
                            color: "blue",
                            bgcolor: "#F3D01640",
                          }}
                        >
                          {material.price
                            ? material.price.toLocaleString()
                            : ""}
                        </TableCell>
                        {Array.from({ length: 13 }).map((_, index) => (
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
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
                        <TableRow>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          ></TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          >
                            {m.code}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          ></TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          ></TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          >
                            {m.name}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          >
                            {m.uom?.name}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              border: "1px solid black",
                              fontWeight: "bold",
                            }}
                          ></TableCell>
                          {Array.from({ length: 13 }).map((_, index) => (
                            <TableCell
                              align="center"
                              sx={{
                                border: "1px solid black",
                                fontWeight: "bold",
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
