import { Box, Paper, Typography, Stack, alpha } from "@mui/material";
import React from "react";
import { PieChart } from "@mui/x-charts";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";

// Màu chủ đạo
const chartColor = "#1a237e";

export default function MaterialChart() {
  const {
    data: materialAssignments = {
      countWithAssignment: 0,
      countWithoutAssignment: 0,
      totalCount: 0,
    },
  } = useQuery({
    queryKey: ["materialAssignments"],
    queryFn: async () => {
      try {
        const response = await api.get(`/materialAssignments/getCount`);
        return response.data.data;
      } catch (error) {
        return {
          countWithAssignment: 0,
          countWithoutAssignment: 0,
          totalCount: 0,
        };
      }
    },
  });

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
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        {/* Header: Title and Main Value */}
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
              Vật tư, tài sản
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: "2.4rem",
                background: `linear-gradient(45deg, ${chartColor} 30%, #424242 90%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {materialAssignments.totalCount}
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PieChart
            series={[
              {
                data: [
                  {
                    id: 0,
                    value: materialAssignments.countWithAssignment,
                    label: `Trong khoán (${materialAssignments.countWithAssignment})`,
                  },
                  {
                    id: 1,
                    value: materialAssignments.countWithoutAssignment,
                    label: `Ngoài khoán (${materialAssignments.countWithoutAssignment})`,
                  },
                ],
                highlightScope: { faded: "global", highlighted: "item" },
                innerRadius: 25,
                outerRadius: 55,
                paddingAngle: 1,
                cornerRadius: 5,
              },
            ]}
            height={120}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            slotProps={{
              legend: {
                direction: "column",
                position: { vertical: "middle", horizontal: "right" },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                labelStyle: {
                  fontSize: 14,
                  fontWeight: 500,
                },
              },
            }}
            sx={{
              "& .MuiPieArc-root": {
                stroke: "#fff",
                strokeWidth: 2,
              },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
