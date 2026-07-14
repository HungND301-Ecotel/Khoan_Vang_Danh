import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import {
  ProductionScopeInputType,
  ProductionScopeOutputType,
} from "../../../types";
import BaseModal from "../../../components/Common/BaseModal";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  code: yup.string().required("Mã diện sản xuất không được để trống"),
  name: yup.string().required("Tên diện sản xuất không được để trống"),
});

export default function ProductionScopeModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ProductionScopeInputType>) => void;
  selected: ProductionScopeOutputType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const formik = useFormik({
    initialValues: {
      code: minimizedData ? minimizedData.code : (selected?.code || ""),
      name: minimizedData ? minimizedData.name : (selected?.name || ""),
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
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize({ ...formik.values, _id: selected?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selected || minimizedData?._id) ? "Chỉnh sửa diện sản xuất" : "Tạo mới diện sản xuất"}
      breadcrumbs={["Danh mục", "Thông số", "Diện sản xuất"]}
      showZoom={true}
      actions={
        <>
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
            {(selected || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Mã diện sản xuất <span style={{ color: "red" }}>*</span>
            </Typography>
            <FieldInput formik={formik} field="code" />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Tên diện sản xuất <span style={{ color: "red" }}>*</span>
            </Typography>
            <FieldInput formik={formik} field="name" />
          </Box>
        </Box>
      </FormikProvider>
    </BaseModal>
  );
}
