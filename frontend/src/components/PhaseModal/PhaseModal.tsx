import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { PhaseGroupType, PhaseInputType, PhaseOutputType } from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import { Divider } from "antd";

const validationSchema = yup.object({
  name: yup.string().required("Tên công đoạn không được để trống"),
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
      {/* Nút X góc trên phải */}
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
          <Typography>Danh mục</Typography>
          <Typography>Công đoạn sản xuất</Typography>
          <Typography>Công đoạn sản xuất</Typography>
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
          {selectedPhase
            ? "Chỉnh sửa Công đoạn sản xuất"
            : "Tạo mới Công đoạn sản xuất"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "700px" }}>
            {/* Nhóm công đoạn */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Nhóm công đoạn
              </Typography>
              <TextField
                fullWidth
                select
                id="phaseGroup"
                name="phaseGroup"
                placeholder="Placeholder"
                value={formik.values.phaseGroup}
                onChange={(event) => {
                  formik.setFieldValue("phaseGroup", event.target.value);
                }}
                variant="outlined"
                sx={{
                  "& .MuiInputBase-root": {
                    height: "32px",
                    borderRadius: "6px",
                    paddingRight: "12px",
                    paddingLeft: "12px",
                    fontSize: "14px",
                  },
                  "& .MuiSelect-select": {
                    color: !formik.values.phaseGroup ? "#999" : "#333",
                  },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "Placeholder";
                    const item = phasegroups.find((group: PhaseGroupType) => group._id === value);
                    return item?.name || "";
                  },
                }}
                error={formik.touched.phaseGroup && Boolean(formik.errors.phaseGroup)}
                helperText={formik.touched.phaseGroup && formik.errors.phaseGroup}
              >
                {phasegroups.map((group: PhaseGroupType) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Mã công đoạn */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã công đoạn
              </Typography>
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

            {/* Tên công đoạn */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên công đoạn
              </Typography>
              <TextField
                fullWidth
                id="name"
                name="name"
                placeholder="Input Text"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
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
                {selectedPhase ? "Cập nhật" : "Xác nhận "}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}