import { Box, IconButton, Paper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import PhaseSection from "./PhaseSection";

interface GroupScopeSectionProps {
  formik: any;
  gIdx: number;
  group: any;
  expandedGroups: number[];
  toggleExpand: (index: number) => void;
  setExpandedGroups: (updater: (prev: number[]) => number[]) => void;
  remove: (index: number) => void;
  emptyPhase: () => any;
  selected: any;
  productionscopesData: any[];
  phasesData: any[];
  assignmentnormsData: any[];
  adjustmentnormsData: any[];
  getError: (gIdx: number, pIdx: number, field: string) => string;
}

export default function GroupScopeSection({
  formik,
  gIdx,
  group,
  expandedGroups,
  toggleExpand,
  setExpandedGroups,
  remove,
  emptyPhase,
  selected,
  productionscopesData,
  phasesData,
  assignmentnormsData,
  adjustmentnormsData,
  getError,
}: GroupScopeSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        p: 2,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
          }}
        >
          <FieldAutoCompleted
            formik={formik}
            field={`groups.${gIdx}.productionScope`}
            title="Diện sản xuất"
            labelkey="code"
            data={productionscopesData}
          />
          {!selected?._id && (
            <IconButton
              onClick={() => {
                const currentPhases = formik.values.groups[gIdx].phases || [];
                formik.setFieldValue(`groups.${gIdx}.phases`, [
                  ...currentPhases,
                  emptyPhase(),
                ]);
                if (!expandedGroups.includes(gIdx)) {
                  setExpandedGroups((prev) => [...prev, gIdx]);
                }
              }}
              size="small"
              sx={{
                color: "#007BFF",
                border: "1px dashed #007BFF",
                borderRadius: "6px",
                p: 0.5,
              }}
              title="Thêm công đoạn"
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            onClick={() => toggleExpand(gIdx)}
            size="small"
            sx={{ color: "#007BFF" }}
          >
            {expandedGroups.includes(gIdx) ? (
              <ExpandLessIcon />
            ) : (
              <ExpandMoreIcon />
            )}
          </IconButton>
        </Box>
        {!selected?._id && formik.values.groups.length > 1 && (
          <IconButton onClick={() => remove(gIdx)} color="error" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {expandedGroups.includes(gIdx) && (
        <PhaseSection
          formik={formik}
          gIdx={gIdx}
          phasesData={phasesData}
          assignmentnormsData={assignmentnormsData}
          adjustmentnormsData={adjustmentnormsData}
          getError={getError}
        />
      )}
    </Paper>
  );
}
