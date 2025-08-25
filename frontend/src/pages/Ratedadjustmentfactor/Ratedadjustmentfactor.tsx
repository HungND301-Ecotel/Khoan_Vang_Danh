import React, { useState, SyntheticEvent } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Breadcrumbs,
} from "@mui/material";
import PhaseGroup from "../PhaseGroup/PhaseGroup";
import Phase from "../Phase/Phase";

export default function MainPage() {
  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
      <Typography>Danh muc</Typography>
        <Typography>Công đoạn sản xuất</Typography>
        <Typography>Nhóm công đoạn sản xuất</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ color: "blue", mt: 2 }}>
        Công đoạn sản xuất
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            display: "inline-block",
            border: "1px solid #e6e9ee",
            borderRadius: 2,
            p: "4px",
            minHeight: "32px",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleChange}
            variant="standard"
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              minHeight: "32px",
              "& .MuiTabs-flexContainer": { gap: 1.5 },
            }}
          >
            <Tab
              label="Nhóm công đoạn sản xuất"
              disableRipple
              sx={{
                textTransform: "none",
                minWidth: 0,
                fontWeight: 500,
                borderRadius: 1.5,
                padding: "8px 18px",
                color: "text.primary",
                backgroundColor: "transparent",
                "&.Mui-selected": {
                  backgroundColor: "#f1f3f5",
                  color: "text.primary",
                },
              }}
            />
            <Tab
              label="Công đoạn sản xuất"
              disableRipple
              sx={{
                textTransform: "none",
                minWidth: 0,
                fontWeight: 500,
                borderRadius: 1.5,
                padding: "8px 18px",
                color: "text.primary",
                backgroundColor: "transparent",
                "&.Mui-selected": {
                  backgroundColor: "#f1f3f5",
                  color: "text.primary",
                },
              }}
            />
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <PhaseGroup />}
        {currentTab === 1 && <Phase />}
      </Box>
    </>
  );
}