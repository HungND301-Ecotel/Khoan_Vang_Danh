import React, { SyntheticEvent, useState } from "react";
import Setttlementreport from "../SettlementReport/SettlementReport";
import Quarterlycontractsettlement from "../Quarterlycontractsettlement/Quarterlycontractsettlement";
import { Box, Breadcrumbs, Tab, Tabs, Typography } from "@mui/material";
import custom_theme from '../../theme';

export default function SettlementReportSummary() {
  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Quyết toán giao khoán</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Quyết toán giao khoán
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
              backgroundColor: '#ffffffff',
              minHeight: "32px",
              "& .MuiTabs-flexContainer": { gap: 1.5 },
            }}
          >
            <Tab
              label="Quyết toán giao khoán Tháng"
              disableRipple
              sx={{
                textTransform: "none",
                minWidth: 0,
                fontWeight: 500,
                borderRadius: 1.5,
                padding: "8px 18px",
                margin: "4px 4px",
                color: "text.primary",
                backgroundColor: "transparent",
                "&.Mui-selected": {
                  backgroundColor: "#f1f3f5",
                  color: "text.primary",
                },
              }}
            />
            <Tab
              label="Quyết toán giao khoán Quý"
              disableRipple
              sx={{
                textTransform: "none",
                minWidth: 0,
                fontWeight: 500,
                borderRadius: 1.5,
                padding: "8px 18px",
                margin: "4px 4px",
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
        {currentTab === 0 && <Setttlementreport />}
        {currentTab === 1 && <Quarterlycontractsettlement />}
      </Box>
    </Box>
  );
}
