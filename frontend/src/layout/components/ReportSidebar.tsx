import { Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const REPORTS = [
  {
    id: 1,
    label: "B/c thực hiện các chỉ tiêu công nghệ",
    path: "/report/technologykpireport",
  },
  {
    id: 2,
    label: "B/c thực hiện kế hoạch điều hành chi phí theo yếu tố",
    path: "/report/costreport",
  },
  {
    id: 3,
    label: "B/c thực hiện định mức vật tư theo phân xưởng",
    path: "/report/materialconsumptionreport",
  },
  {
    id: 4,
    label: "B/c biên bản tổng hợp quyết toán giao khoán",
    path: "/report/settlementreport",
  },
  {
    id: 5,
    label: "B/c công đoạn sản xuất",
    path: "/report/productionphasereport",
  },
];

export default function ReportSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - Navy Blue */}
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{
          color: "#fff",
          bgcolor: "#002147", // Màu xanh nước biển đậm
          p: 2,
          borderRadius: "4px 4px 0 0",
          fontSize: "1.1rem",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        Danh mục báo cáo
      </Typography>

      {/* Menu items list */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
          border: "1px solid #e0e0e0",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          overflow: "hidden",
          boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        {REPORTS.map((item) => {
          // Kiểm tra item có đang active dựa trên URL không
          const isActive = location.pathname === item.path;

          return (
            <Box
              key={item.id}
              onClick={() => navigate(item.path)}
              sx={{
                display: "flex",
                alignItems: "flex-start", // Căn đỉnh để text dài không bị lệch icon
                cursor: "pointer",
                pl: 1.5,
                pr: 1,
                py: 1.8,
                borderLeft: "4px solid transparent",
                transition: "all 0.2s",
                bgcolor: isActive ? "#f0f4f8" : "transparent",
                borderLeftColor: isActive ? "#002147" : "transparent",
                borderBottom: "1px solid #f0f0f0",
                "&:last-child": { borderBottom: "none" },
                "&:hover": {
                  bgcolor: "#f5f7f9",
                  "& .sidebar-icon": { color: "#002147" },
                  "& .sidebar-text": { color: "#002147" },
                },
              }}
            >
              {/* Biểu tượng tam giác nằm ngoài */}
              <Typography
                className="sidebar-icon"
                sx={{
                  mr: 1,
                  fontSize: "1.1rem",
                  lineHeight: 1.2,
                  color: isActive ? "#002147" : "#999",
                  transition: "color 0.2s",
                }}
              >
                ▸
              </Typography>

              {/* Nội dung text */}
              <Typography
                className="sidebar-text"
                sx={{
                  fontSize: "0.95rem",
                  lineHeight: 1.4,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#002147" : "#333",
                  transition: "color 0.2s",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
