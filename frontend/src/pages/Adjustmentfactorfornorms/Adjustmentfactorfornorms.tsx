import React, { SyntheticEvent, useState } from "react";
import { Breadcrumbs, Typography, Box, Tabs, Tab } from "@mui/material";
import AdjustmentNormKKT from "../AdjustmentNormKKT/AdjustmentNormKKT";
import AdjustmentNormCM from "../AdjustmentNormCM/AdjustmentNormCM";
import AdjustmentNormKDL from "../AdjustmentNormKDL/AdjustmentNormKDL";
import custom_theme from '../../theme';

const Adjustmentfactorfornorms = () => {
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
        <Typography>Danh muc</Typography>
        <Typography>Hệ số điều chỉnh định mức</Typography>
        <Typography>
          {currentTab === 0 && "Hệ số điều chỉnh định mức (CK.KT)"}
          {currentTab === 1 && "Hệ số điều chỉnh định mức (CK.ĐL)"}
          {currentTab === 2 && "Hệ số điều chỉnh định mức (CM)"}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Hệ số điều chỉnh định mức
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
              label="Hệ số điều chỉnh định mức CK.KT"
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
              label="Hệ số điều chỉnh định mức CK.ĐL"
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
              label="Hệ số điều chỉnh định mức CM"
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
        {currentTab === 0 && <AdjustmentNormKKT />}
        {currentTab === 1 && <AdjustmentNormKDL />}
        {currentTab === 2 && <AdjustmentNormCM />}
      </Box>
    </Box>
  );
};

export default Adjustmentfactorfornorms;