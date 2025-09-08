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
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { AssignmentCodeInputType, AssignmentCodeOutputType, DeviceCodeType, UnitType } from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import { Divider } from "antd";

const validationSchema = yup.object({
  name: yup.string().required("Tên giao khoán không được để trống"),
});

export default function AssignmentCodeModal({
  open,
  setOpen,
  handleSubmit,
  selectedAssignmentCode,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentCodeInputType>) => void;
  selectedAssignmentCode: AssignmentCodeOutputType | null;
}) {
  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });
  const { data: devicecodes = [] } = useQuery({
    queryKey: ["devicecodes"],
    queryFn: () => api.get("/devicecodes").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selectedAssignmentCode ? selectedAssignmentCode.code : "",
      name: selectedAssignmentCode ? selectedAssignmentCode.name : "",
      uom: selectedAssignmentCode ? selectedAssignmentCode.uom?._id : "",
      deviceCode: selectedAssignmentCode ? selectedAssignmentCode.deviceCode?._id : "",
      price: selectedAssignmentCode ? selectedAssignmentCode.price : undefined,
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
          <Typography>Mã giao khoán</Typography>
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
          {selectedAssignmentCode ? "Sửa mã giao khoán" : "Tạo mới mã giao khoán"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "700px" }}>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Mã giao khoán</Typography>
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
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Tên mã giao khoán</Typography>
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
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Đơn vị tính</Typography>
              <TextField
                fullWidth
                select
                id="uom"
                name="uom"
                placeholder="Chọn đơn vị tính"
                value={formik.values.uom}
                onChange={formik.handleChange}
                error={formik.touched.uom && Boolean(formik.errors.uom)}
                helperText={formik.touched.uom && formik.errors.uom}
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
                {units.map((unit: UnitType) => (
                  <MenuItem key={unit._id} value={unit._id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Mã thiết bị</Typography>
              <TextField
                fullWidth
                select
                id="deviceCode"
                name="deviceCode"
                placeholder="Chọn mã thiết bị"
                value={formik.values.deviceCode}
                onChange={formik.handleChange}
                error={formik.touched.deviceCode && Boolean(formik.errors.deviceCode)}
                helperText={formik.touched.deviceCode && formik.errors.deviceCode}
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
                {devicecodes.map((devicecode: DeviceCodeType) => (
                  <MenuItem key={devicecode._id} value={devicecode._id}>
                    {devicecode.code}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>Đơn giá</Typography>
              <TextField
                fullWidth
                id="price"
                name="price"
                placeholder="Input Text"
                value={formik.values.price}
                onChange={formik.handleChange}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
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
                {selectedAssignmentCode ? "Cập nhật" : "Xác nhận"}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}