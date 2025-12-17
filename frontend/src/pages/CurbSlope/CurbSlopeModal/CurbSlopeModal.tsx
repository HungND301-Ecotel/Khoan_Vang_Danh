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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { ThicknessType } from "../../../types";
import { Divider } from "antd";

const validationSchema = yup.object({
  name: yup.string().required("Chiều dày vỉa không được để trống"),
});

export default function CurbSlopeModal({
  open,
  setOpen,
  handleSubmit,
  selectedCurbSlope,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ThicknessType>) => void;
  selectedCurbSlope: ThicknessType | null;
}) {
  const formik = useFormik({
    initialValues: {
      name: selectedCurbSlope ? selectedCurbSlope.name : "",
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
          borderRadius: '12px'
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
          <Typography>Danh mục</Typography>
          <Typography>Thông số </Typography>
          <Typography>Độ dốc vỉa</Typography>
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
          {selectedCurbSlope ? "Chỉnh sửa độ dốc vỉa" : "Tạo mới độ dốc vỉa"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "700px" }}>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Độ dốc vỉa</Typography>
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
            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {["≥", "≤", "<", ">", "%", "°", "="].map((symbol) => (
                <Button
                  key={symbol}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    formik.setFieldValue("name", formik.values.name + symbol);
                    setTimeout(() => {
                      document.getElementById("name")?.focus();
                    }, 0);
                  }}
                  sx={{
                    height: "32px",
                    minWidth: "40px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    textTransform: "none",
                    borderColor: "#e0e0e0",
                    color: "#666",
                    "&:hover": {
                      borderColor: "#ccc",
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  {symbol}
                </Button>
              ))}
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
                {selectedCurbSlope ? "Cập nhật" : "Xác nhận "}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}