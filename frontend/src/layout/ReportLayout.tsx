import { Box, Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
import ReportSidebar from "./components/ReportSidebar";

export default function ReportLayout() {
  return (
    <Grid
      container
      spacing={3}
      sx={{
        width: "100%",
        m: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Sidebar */}
      <Grid item xs={12} md={3}>
        <Box
          sx={{
            position: "sticky",
            top: 144,
            zIndex: 10,
          }}
        >
          <ReportSidebar />
        </Box>
      </Grid>

      {/* Content */}
      <Grid
        item
        xs={12}
        md={9}
        sx={{
          minWidth: 0,
        }}
      >
        <Box component="main">
          <Outlet />
        </Box>
      </Grid>
    </Grid>
  );
}
