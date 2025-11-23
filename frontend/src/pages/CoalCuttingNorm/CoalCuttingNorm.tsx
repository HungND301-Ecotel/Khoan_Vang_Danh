import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Container,
  Box,
  MenuItem,
  Grid,
  Button,
  Typography,
  IconButton,
  Breadcrumbs,
  Tabs,
  Tab,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  AssignmentNormOutputType,
  AssignmentNormInputType,
  PhaseOutputType,
} from "../../types";
import { Add, Delete, Edit, Visibility } from "@mui/icons-material";
import CoalCuttingNormKBModal from "../../components/CoalCuttingNormKBModal/CoalCuttingNormKBModal";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import CoalCuttingNormKB from "../CoalCuttingNormKB/CoalCuttingNormKB";
import CoalCuttingNormZH from "../CoalCuttingNormZH/CoalCuttingNormZH";
import CoalCuttingNormZRY from "../CoalCuttingNormZRY/CoalCuttingNormZRY";
import custom_theme from '../../theme';

export default function CoalCuttingNorm() {
  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: () => api.get("/phases").then((res) => res.data.data),
  });

  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  const coalPhases = phases.data.filter(
    (i: PhaseOutputType) => i.phaseGroup?.name?.toLowerCase() === "khấu than"
  );

  return (
    <Box sx={{
      px: 5,           // horizontal = 32px
      py: 1,           // vertical = 8px
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Định mức khấu than</Typography>
        <Typography>{coalPhases[currentTab]?.code ?? "KB"}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Định mức khấu than
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
            {phases.data
              .filter(
                (i: PhaseOutputType) =>
                  i.phaseGroup?.name?.toLowerCase() === "khấu than"
              )
              .map((p: PhaseOutputType, idx: number) => (
                <Tab
                  key={p._id ?? p.code ?? idx}
                  value={idx}
                  label={p.code}
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
              ))}
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <CoalCuttingNormKB />}
        {currentTab === 1 && <CoalCuttingNormZH />}
        {currentTab === 2 && <CoalCuttingNormZRY />}
      </Box>
    </Box>
  );
}
