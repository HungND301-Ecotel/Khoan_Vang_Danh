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
  Grid,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import {
  AssignmentCodeOutputType,
  MaterialAssignmentInputType,
  Materials,
  UnitType,
} from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import { Divider } from "antd";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
dayjs.extend(utc);

const validationSchema = yup.object({
  name: yup
    .string()
    .required("Tên vật tư ngoài giao khoán không được để trống"),
  price: yup
    .number()
    .min(0, "Đơn giá phải lớn hơn hoặc bằng 0")
    .required("Đơn giá không được để trống"),
});

export default function MaterialsOutsideContractModal({
  open,
  setOpen,
  handleSubmit,
  selectedMaterialOutsideContract,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialAssignmentInputType>) => void;
  selectedMaterialOutsideContract: Materials | null;
}) {
  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await api.get("/units");
      console.log("Units API:", res.data);
      return res.data.data || res.data.units || res.data;
    },
  });

  const formik = useFormik({
    initialValues: {
      code: selectedMaterialOutsideContract
        ? selectedMaterialOutsideContract.code
        : "",
      name: selectedMaterialOutsideContract
        ? selectedMaterialOutsideContract.name
        : "",
      uom: selectedMaterialOutsideContract
        ? selectedMaterialOutsideContract.uom?._id ||
          selectedMaterialOutsideContract.uom
        : "",
      quantity: selectedMaterialOutsideContract
        ? selectedMaterialOutsideContract.quantity
        : "",
      price: selectedMaterialOutsideContract?.priceHistory?.[0]?.price || 0,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const transformedValues: MaterialAssignmentInputType = {
        ...values,
        quantity:
          typeof values.quantity === "string"
            ? Number(values.quantity)
            : values.quantity,
        priceHistory: [
          {
            price: values.price,
            startDate: new Date().toISOString().substring(0, 10),
            endDate: new Date().toISOString().substring(0, 10),
          },
        ],
      };
      handleSubmit(transformedValues);
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
          height: "600px",
          p: "32px",
          position: "relative",
          borderRadius: "8px",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "24px",
          height: "24px",
          opacity: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: "20px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "14px" }}>
          <Typography sx={{ color: "#666" }}>Danh mục</Typography>
          <Typography sx={{ color: "#666" }}>Vật tư, tài sản</Typography>
          <Typography sx={{ color: "#666" }}>
            Vật tư, tài sản ngoài khoán
          </Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography
          sx={{ fontSize: "20px", color: "#1976d2", fontWeight: 500 }}
        >
          {selectedMaterialOutsideContract
            ? "Chỉnh sửa Vật tư, tài sản ngoài khoán"
            : "Tạo mới Vật tư, tài sản ngoài khoán"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: "visible" }}>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Mã vật tư, tài sản
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
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Tên vật tư, tài sản
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
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Số lượng
                </Typography>
                <TextField
                  fullWidth
                  id="quantity"
                  name="quantity"
                  placeholder="Input Text"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.quantity && Boolean(formik.errors.quantity)
                  }
                  helperText={formik.touched.quantity && formik.errors.quantity}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Đơn vị tính
                </Typography>
                <TextField
                  fullWidth
                  select
                  id="uom"
                  name="uom"
                  placeholder="Placeholder"
                  value={formik.values.uom}
                  onChange={formik.handleChange}
                  error={formik.touched.uom && Boolean(formik.errors.uom)}
                  helperText={formik.touched.uom && formik.errors.uom}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
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
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Đơn giá
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  id="price"
                  name="price"
                  placeholder="Nhập đơn giá"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={formik.touched.price && formik.errors.price}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>

              <DialogActions
                sx={{ mt: 4, px: 0, gap: "12px", justifyContent: "flex-end" }}
              >
                <Button
                  onClick={handleClose}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    borderRadius: "8px",
                    height: "40px",
                    minWidth: "80px",
                    fontSize: "14px",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#e0e0e0",
                    },
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => formik.submitForm()}
                  variant="contained"
                  sx={{
                    backgroundColor: "#1976d2",
                    borderRadius: "8px",
                    height: "40px",
                    minWidth: "100px",
                    fontSize: "14px",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  Xác nhận
                </Button>
              </DialogActions>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}
