import { Box, Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
import ReportSidebar from "./components/ReportSidebar";

export default function ReportLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        gap: 3,
        overflow: "hidden",
        boxSizing: "border-box",
        alignItems: "flex-start",
      }}
    >
      {/* Sidebar – fixed width, never expands */}
      <Box
        sx={{
          flexShrink: 0,
          width: 280,
          position: "sticky",
          top: 116,
          zIndex: 10,
          alignSelf: "stretch", // sidebar expands to full height
        }}
      >
        <ReportSidebar />
      </Box>

      {/* Content – takes remaining space, clips overflow so table can scroll */}
      <Box
        component="main"
        sx={{
          flex: "1 1 0%",
          width: 0,
          overflow: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
