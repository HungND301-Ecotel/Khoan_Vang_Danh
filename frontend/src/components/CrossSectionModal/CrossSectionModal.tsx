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
import { CrossSectionOutputType, CrossSectionInputType, UnitType } from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import { Divider } from "antd";

const validationSchema = yup.object({
  name: yup.string().required("Tiết diện lò xén không được để trống"),
});

export default function CrossSection({
  open,
  setOpen,
  handleSubmit,
  selectedCrossSection,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<CrossSectionInputType>) => void;
  selectedCrossSection: CrossSectionOutputType | null;
}) {
  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      name: selectedCrossSection ? selectedCrossSection.name : "",
      uom: selectedCrossSection ? selectedCrossSection.uom?._id : "",
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
          <Typography>Thông số</Typography>
          <Typography>Tiết diện lò xén</Typography>
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
          {selectedCrossSection ? "Chỉnh sửa tiết diện lò xén" : "Tạo mới Tiết diện lò xén"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "700px" }}>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Tiết diện lò xén</Typography>
              <TextField
                fullWidth
                id="name"
                name="name"
                placeholder="Nhập tên tiết diện..."
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
              {["≥", "≤", "<", ">", "%", "°", "=", "-", "+", "−"].map((symbol) => (
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
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Đơn vị tính</Typography>
              <TextField
                select
                id="uom"
                name="uom"
                placeholder="Chọn đơn vị tính"
                value={formik.values.uom}
                onChange={formik.handleChange}
                error={formik.touched.uom && Boolean(formik.errors.uom)}
                helperText={formik.touched.uom && formik.errors.uom}
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: "32px",
                    borderRadius: "6px",
                    paddingRight: "12px",
                    paddingLeft: "12px",
                    fontSize: "14px",
                  },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return <span style={{ color: "#999" }}>Chọn đơn vị tính</span>;
                    }
                    const selectedUnit = units.find((unit: UnitType) => unit._id === selected);
                    return selectedUnit?.name;
                  },
                }}
              >
                {units.map((unit: UnitType) => (
                  <MenuItem
                    key={unit._id}
                    value={unit._id}
                    sx={{
                      fontSize: "14px",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "#e3f2fd",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      },
                    }}
                  >
                    {unit.name}
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
                {selectedCrossSection ? "Cập nhật" : "Xác nhận "}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}