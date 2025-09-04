import { YouTube } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { PhaseGroupType, PhaseInputType, PhaseOutputType } from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

const validationSchema = yup.object({
  name: yup.string().required("Tên nhóm công đoạn không được để trống"),
  phaseGroup: yup.string(),
});
export default function PhaseModal({
  open,
  setOpen,
  handleSubmit,
  selectedPhase,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<PhaseInputType>) => void;
  selectedPhase: PhaseOutputType | null;
}) {
  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: () => api.get("/phasegroups").then((res) => res.data.data),
  });
  const formik = useFormik({
    initialValues: {
      code: selectedPhase ? selectedPhase.code : "",
      name: selectedPhase ? selectedPhase.name : "",
      phaseGroup: selectedPhase ? selectedPhase.phaseGroup?._id : "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedPhase ? "Sửa công đoạn" : "Tạo mới công đoạn"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              select
              id="phaseGroup"
              name="phaseGroup"
              label="Nhóm công đoạn"
              value={formik.values.phaseGroup}
              onChange={(event) => {
                formik.setFieldValue("phaseGroup", event.target.value);
              }}
              error={
                formik.touched.phaseGroup && Boolean(formik.errors.phaseGroup)
              }
              helperText={formik.touched.phaseGroup && formik.errors.phaseGroup}
            >
              {phasegroups.map((group: PhaseGroupType) => (
                <MenuItem key={group._id} value={group._id}>
                  {group.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Mã công đoạn"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tên công đoạn"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedPhase ? "Cập nhật" : "Thêm mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}