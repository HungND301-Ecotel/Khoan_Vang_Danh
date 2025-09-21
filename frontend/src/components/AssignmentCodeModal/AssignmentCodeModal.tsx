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
import React, { Dispatch, SetStateAction, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { AssignmentCodeInputType, AssignmentCodeOutputType, DeviceCodeType, UnitType } from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import { Divider } from "antd";
import Firework from "../Firework/Firework"; // Import Firework

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
  handleSubmit: (values: Partial<AssignmentCodeInputType>) => Promise<void>; // Changed to Promise
  selectedAssignmentCode: AssignmentCodeOutputType | null;
}) {
  const [showFirework, setShowFirework] = useState(false); // Add firework state
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

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
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await handleSubmit(values);
        
        // 🎉 Trigger firework animation only for CREATE operations
        if (!selectedAssignmentCode) {
          setShowFirework(true);
          
          // Auto-close modal after firework animation
          setTimeout(() => {
            handleClose();
          }, 2000); // Close modal 2 seconds after firework starts
        } else {
          // For edit operations, close immediately
          handleClose();
        }
      } catch (error) {
        console.error('Submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (showFirework) return; // Prevent closing during firework animation
    
    formik.resetForm();
    setOpen(false);
    setShowFirework(false);
  };

  const handleFireworkComplete = () => {
    setShowFirework(false);
    // Modal will already be closed by the timeout in onSubmit
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: "800px",
            height: "740px",
            p: "40px",
            position: "relative",
            // Disable pointer events during firework
            pointerEvents: showFirework ? 'none' : 'auto',
            opacity: showFirework ? 0.9 : 1,
            transition: 'opacity 0.3s ease',
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          disabled={isSubmitting || showFirework}
          sx={{
            position: "absolute",
            top: "40px",
            right: "40px",
            width: "16px",
            height: "16px",
            opacity: (isSubmitting || showFirework) ? 0.5 : 1,
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
                  disabled={isSubmitting || showFirework}
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
                  disabled={isSubmitting || showFirework}
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
                  disabled={isSubmitting || showFirework}
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
                  disabled={isSubmitting || showFirework}
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
                  disabled={Boolean(selectedAssignmentCode) || isSubmitting || showFirework}
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
                  disabled={isSubmitting || showFirework}
                  sx={{
                    backgroundColor: "#DFE2EA",
                    borderRadius: "8px",
                    height: "32px",
                    minWidth: "91px",
                    fontSize: "14px",
                    textTransform: "none",
                    opacity: (isSubmitting || showFirework) ? 0.5 : 1,
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => formik.submitForm()}
                  variant="contained"
                  disabled={isSubmitting || showFirework}
                  sx={{
                    backgroundColor: isSubmitting ? "#ccc" : "#007BFF",
                    borderRadius: "8px",
                    height: "32px",
                    minWidth: "91px",
                    fontSize: "14px",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: isSubmitting ? "#ccc" : "#0056b3",
                    },
                  }}
                >
                  {isSubmitting 
                    ? "Đang xử lý..." 
                    : selectedAssignmentCode 
                      ? "Cập nhật" 
                      : "Xác nhận"
                  }
                </Button>
              </DialogActions>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 🎉 Firework Animation - Shows when successfully creating a record */}
      <Firework 
        show={showFirework} 
        onComplete={handleFireworkComplete}
      />
    </>
  );
}