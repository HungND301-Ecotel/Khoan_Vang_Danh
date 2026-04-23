import React, { useState } from "react";
import { LineChart } from "@mui/x-charts";
import {
  Typography,
  Box,
  Paper,
  TextField,
  CircularProgress,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";

export default function CostProfitChart() {
  const [selectedYear, setSelectedYear] = useState(dayjs().format("YYYY"));

  const { data: dashboardData = [], isLoading } = useQuery({
    queryKey: ["dashboardCostDataByYear", selectedYear],
    queryFn: () =>
      api
        .get(`/contractsettlements/getDashboardData?year=${selectedYear}`)
        .then((res) => res.data.data),
    enabled: !!selectedYear,
  });

  const chartData = dashboardData
    ? dashboardData.map((item: any) => {
        const monthArr = item.month.split("-");
        const monthNum =
          monthArr.length > 1 ? parseInt(monthArr[1], 10) : item.month;
        return {
          month: `Tháng ${monthNum}`,
          planned: item.totalPlanned || 0,
          actual: item.totalUsed || 0,
          profitLoss: item.variance || 0,
        };
      })
    : [];

  return (
    <Paper
      elevation={3}
      sx={{ padding: 2, margin: "auto", borderRadius: "12px" }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Biểu đồ chi phí thực hiện, kế hoạch và lỗ/ lãi theo tháng
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
          <DatePicker
            label="Chọn năm"
            inputFormat="YYYY"
            views={["year"]}
            openTo="year"
            value={selectedYear ? dayjs(selectedYear) : null}
            onChange={(value) => {
              setSelectedYear(value ? dayjs(value).format("YYYY") : "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                sx={{ backgroundColor: "#fff" }}
              />
            )}
          />
        </LocalizationProvider>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            width: "100%",
            height: 400,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%", height: 400 }}>
          <LineChart
            dataset={chartData}
            xAxis={[
              {
                scaleType: "band",
                dataKey: "month",
                label: "Tháng",
                tickLabelStyle: {
                  angle: -45,
                  textAnchor: "end",
                  fontSize: 12,
                },
              },
            ]}
            yAxis={[
              { id: "cost", label: "Chi phí (Đơn vị tiền)" },
              { id: "profitLoss", label: "Lỗ/Lãi (Đơn vị tiền)" },
            ]}
            series={[
              {
                dataKey: "planned",
                label: "Chi phí Kế hoạch",
                yAxisKey: "cost",
                color: "#4caf50",
              },
              {
                dataKey: "actual",
                label: "Chi phí Thực hiện",
                yAxisKey: "cost",
                color: "#f44336",
              },
              {
                dataKey: "profitLoss",
                label: "Lỗ/Lãi",
                yAxisKey: "profitLoss",
                color: "#2196f3",
              },
            ]}
            height={400}
            slotProps={{
              legend: {
                direction: "column",
                position: { vertical: "middle", horizontal: "right" },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                labelStyle: {
                  fontSize: 14,
                },
                padding: 10,
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
