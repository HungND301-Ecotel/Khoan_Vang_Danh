import React, { SyntheticEvent, useState } from "react";
import ExcavationTech from "../ExcavationTech/ExcavationTech";
import CrossSection from "../CrossSection/CrossSection";
import Hardness from "../Hardness/Hardness";
import CurbSlope from "../CurbSlope/CurbSlope";
import Thickness from "../Thickness/Thickness";
import Length from "../Length/Length";
import MiningTech from "../MiningTech/MiningTech";
import Step from "../Step/Step";
import { Box, Breadcrumbs, Tab, Tabs, Typography } from "@mui/material";
import custom_theme from '../../theme';

const Parameter = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  return (
    <Box sx={{
           px: 15,           // horizontal = 32px
           py: 1,           // vertical = 8px
          }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh muc</Typography>
        <Typography>Thông số</Typography>
        <Typography>
          {currentTab === 0 && "Công nghệ xúc"}
          {currentTab === 1 && "Tiết diện lò xén"}
          {currentTab === 2 && "Độ cứng than/ đá (f)"}
          {currentTab === 3 && "Độ dốc vỉa"}
          {currentTab === 4 && "Độ dày vỉa (Mv)"}
          {currentTab === 5 && "Chiều dài"}
          {currentTab === 6 && "Công nghệ khai thác"}
          {currentTab === 7 && "Chống"}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Thông số
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
              label="Công nghệ xúc"
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
              label="Tiết diện lò xén"
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
              label="Độ cứng than/ đá (f)"
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
              label="Độ dốc vỉa"
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
              label="Độ dày vỉa (Mv)"
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
              label="Chiều dài"
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
              label="Công nghệ khai thác "
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
              label="Chống "
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
        {currentTab === 0 && <ExcavationTech />}
        {currentTab === 1 && <CrossSection />}
        {currentTab === 2 && <Hardness />}
        {currentTab === 3 && <CurbSlope />}
        {currentTab === 4 && <Thickness />}
        {currentTab === 5 && <Length />}
        {currentTab === 6 && <MiningTech />}
        {currentTab === 7 && <Step />}
      </Box>
    </Box>
  );
};

export default Parameter;
