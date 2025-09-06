import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  AdjustmentNormOutputType,
  AssignmentNormOutputType,
  MaterialBudgetInputType,
  PhaseGroupType,
  PhaseOutputType,
} from "../../types";
import { Divider } from "antd";

const validationSchema = yup.object({
  code: yup.string().required("Mã chi phí không được để trống"),
  production: yup.number().required("Sản lượng không được để trống"),
  phaseGroup: yup.string().required("Nhóm công đoạn không được để trống"),
  phase: yup.string().required("Công đoạn không được để trống"),
  assignmentNormCode: yup.string().required("Mã định mức giao khoán không được để trống"),
  adjustmentNormCode: yup.string().required("Mã định hệ số điều chỉnh định mức không được để trống"),
});

export default function MaterialBudgetModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialBudgetInputType>) => void;
  selected: MaterialBudgetInputType | null;
}) {
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null);

  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get("/phasegroups").then((res) => res.data.data),
  });
  const { data: phases = [] } = useQuery({
    queryKey: ["phases", phaseGroup],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroup}`).then((res) => res.data.data),
    enabled: !!phaseGroup,
  });
  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ["assignmentnorms"],
    queryFn: async () =>
      api.get("/assignmentnorms").then((res) => res.data.data),
  });
  const { data: adjustmentnorms = [] } = useQuery({
    queryKey: ["adjustmentnorms"],
    queryFn: async () =>
      api.get("/adjustmentnorms").then((res) => res.data.data),
  });

  useEffect(() => {
    if (selected && phasegroups.length > 0) {
      setPhaseGroup(selected.phaseGroup || "");
    }
  }, [selected, phasegroups]);

  const formik = useFormik({
    initialValues: {
      code: selected?.code || "",
      phaseGroup: phaseGroup || "",
      phase: selected?.phase || "",
      assignmentNormCode: selected?.assignmentNormCode || "",
      adjustmentNormCode: selected?.adjustmentNormCode || "",
      production: selected?.production || undefined,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "800px",
          height: "740px",
          p: "40px",
          position: "relative",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "40px",
          right: "40px",
          width: "16px",
          height: "16px",
          opacity: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: "16px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mt: "16px" }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "14px" }}>
          <Typography>Thống kê vận hành</Typography>
          <Typography>Chi phí vật tư kế hoạch</Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography sx={{ fontSize: "24px", color: "#2B4A82" }}>
          {selected ? "Chỉnh sửa Chi phí vật tư kế hoạch" : "Tạo mới chi phí vật tư kế hoạch"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "700px" }}>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Mã chi phí</Typography>
                <TextField
                  fullWidth
                  id="code"
                  name="code"
                  placeholder="Input Text"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  error={formik.touched.code && Boolean(formik.errors.code)}
                  helperText={formik.touched.code && formik.errors.code}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Sản lượng</Typography>
                <TextField
                  fullWidth
                  id="production"
                  name="production"
                  type="number"
                  placeholder="Input Text"
                  value={formik.values.production}
                  onChange={formik.handleChange}
                  error={formik.touched.production && Boolean(formik.errors.production)}
                  helperText={formik.touched.production && formik.errors.production}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Nhóm công đoạn</Typography>
                <TextField
                  fullWidth
                  select
                  id="phaseGroup"
                  name="phaseGroup"
                  placeholder="Chọn nhóm công đoạn"
                  value={formik.values.phaseGroup}
                  onChange={(event) => {
                    setPhaseGroup(event.target.value);
                    formik.setFieldValue("phaseGroup", event.target.value);
                  }}
                  error={formik.touched.phaseGroup && Boolean(formik.errors.phaseGroup)}
                  helperText={formik.touched.phaseGroup && formik.errors.phaseGroup}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                >
                  {phasegroups?.map((group: PhaseGroupType) => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Công đoạn</Typography>
                <TextField
                  fullWidth
                  select
                  id="phase"
                  name="phase"
                  placeholder="Chọn công đoạn"
                  value={formik.values.phase}
                  onChange={formik.handleChange}
                  error={formik.touched.phase && Boolean(formik.errors.phase)}
                  helperText={formik.touched.phase && formik.errors.phase}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                >
                  {phases?.map((phase: PhaseOutputType) => (
                    <MenuItem key={phase._id} value={phase._id}>
                      {phase.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Mã định mức giao khoán</Typography>
                <TextField
                  fullWidth
                  select
                  id="assignmentNormCode"
                  name="assignmentNormCode"
                  placeholder="Chọn mã định mức giao khoán"
                  value={formik.values.assignmentNormCode}
                  onChange={formik.handleChange}
                  error={formik.touched.assignmentNormCode && Boolean(formik.errors.assignmentNormCode)}
                  helperText={formik.touched.assignmentNormCode && formik.errors.assignmentNormCode}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                >
                  {assignmentnorms?.map((item: AssignmentNormOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Mã định hệ số điều chỉnh định mức</Typography>
                <TextField
                  fullWidth
                  select
                  id="adjustmentNormCode"
                  name="adjustmentNormCode"
                  placeholder="Chọn mã định hệ số điều chỉnh"
                  value={formik.values.adjustmentNormCode}
                  onChange={formik.handleChange}
                  error={formik.touched.adjustmentNormCode && Boolean(formik.errors.adjustmentNormCode)}
                  helperText={formik.touched.adjustmentNormCode && formik.errors.adjustmentNormCode}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "32px",
                      borderRadius: "6px",
                      paddingRight: "12px",
                      paddingLeft: "12px",
                      fontSize: "14px",
                    },
                  }}
                >
                  {adjustmentnorms?.map((item: AdjustmentNormOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <DialogActions sx={{ mt: 3, px: 0, gap: "10px" }}>
                <Button
                  onClick={handleClose}
                  sx={{
                    backgroundColor: "#DFE2EA",
                    borderRadius: "8px",
                    height: "32px",
                    minWidth: "91px",
                    fontSize: "14px",
                    textTransform: "none",
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => formik.submitForm()}
                  variant="contained"
                  sx={{
                    backgroundColor: "#007BFF",
                    borderRadius: "8px",
                    height: "32px",
                    minWidth: "91px",
                    fontSize: "14px",
                    textTransform: "none",
                  }}
                >
                  {selected ? "Cập nhật" : "Thêm mới"}
                </Button>
              </DialogActions>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}