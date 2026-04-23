import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  alpha,
  CircularProgress,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { BarChart } from "@mui/x-charts/BarChart";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { formattedPrice } from "../../../utils/helpers";

// Màu chủ đạo
const chartColor = "#1a237e";

export default function CostCard() {
  const { data: dashboardData = [], isLoading } = useQuery({
    queryKey: ["dashboardCostData"],
    queryFn: () =>
      api
        .get("/contractsettlements/getDashboardData")
        .then((res) => res.data.data),
  });

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "24px",
          height: 240,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid #f0f0f0",
        }}
      >
        <CircularProgress size={32} thickness={5} />
      </Paper>
    );
  }

  // Lấy dữ liệu tháng mới nhất
  const latestData =
    dashboardData && dashboardData.length > 0
      ? dashboardData[dashboardData.length - 1]
      : { totalUsed: 0, variance: 0, month: "" };

  // Tạo nhãn tháng cho biểu đồ (T11, T12, T1...)
  const monthLabels = dashboardData
    ? dashboardData.map((item: any) => {
        const [, m] = item.month.split("-");
        return `T${parseInt(m)}`;
      })
    : [];

  const dailyData = dashboardData
    ? dashboardData.map((item: any) => item.totalUsed)
    : [];

  const chartXAxis = [
    {
      scaleType: "band" as const,
      data: monthLabels,
    },
  ];
  const chartYAxis = [
    {
      scaleType: "linear" as const,
      min: 0,
      max: Math.max(...dailyData, 1) * 1.2,
    },
  ];

  const chartSeries = [
    {
      data: dailyData,
      color: chartColor,
    },
  ];

  const isProfit = latestData.variance >= 0;
  const statusColor = isProfit ? "#00c853" : "#ff3d00";

  // Tính toán phần trăm so với kế hoạch
  const budget = (latestData.totalUsed || 0) + (latestData.variance || 0);
  const percent =
    budget > 0 ? (Math.abs(latestData.variance) / budget) * 100 : 0;

  // Định dạng tiêu đề tháng hiện tại (ví dụ: Tháng 04/2026)
  const currentMonthYear = latestData.month
    ? `Tháng ${latestData.month.split("-")[1]}/${latestData.month.split("-")[0]}`
    : "Tháng hiện tại";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "24px",
        height: 240,
        backgroundColor: "#fff",
        border: "1px solid #f0f0f0",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Element */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(chartColor, 0.05)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />

      <Stack
        spacing={3}
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        {/* Header: Title and Mini-Chart */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Stack spacing={0.5}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Tổng chi phí sản xuất
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: chartColor, fontSize: "1rem" }}
            >
              {currentMonthYear}
            </Typography>
          </Stack>

          <Box sx={{ width: 80, height: 40 }}>
            <BarChart
              disableAxisListener
              xAxis={chartXAxis}
              yAxis={chartYAxis}
              series={chartSeries}
              height={40}
              width={80}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              slotProps={{
                legend: { hidden: true },
              }}
              sx={{
                "& .MuiChartsAxis-root": { display: "none" },
                "& .MuiBarElement-root": {
                  rx: 2,
                },
              }}
            />
          </Box>
        </Box>

        {/* Main Value */}
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: "2.4rem",
              background: `linear-gradient(45deg, ${chartColor} 30%, #424242 90%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {formattedPrice(latestData.totalUsed) || 0}
          </Typography>
        </Box>

        {/* Footer: Variance Analysis */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: alpha(statusColor, 0.1),
                borderRadius: "12px",
                padding: "6px 12px",
                gap: 0.5,
                border: `1px solid ${alpha(statusColor, 0.2)}`,
              }}
            >
              {isProfit ? (
                <ArrowDownwardIcon sx={{ color: statusColor, fontSize: 18 }} />
              ) : (
                <ArrowUpwardIcon sx={{ color: statusColor, fontSize: 18 }} />
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: statusColor,
                  fontSize: "1rem",
                }}
              >
                {percent.toFixed(1)}%
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: statusColor,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.5px",
              }}
            >
              {isProfit ? "Tiết kiệm" : "Vượt định mức"}
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontFamily: "monospace",
              fontWeight: 500,
            }}
          >
            {formattedPrice(Math.abs(latestData.variance))}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
