import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { DeviceCodeType } from "../../../types";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  code: yup.string().required("Mã thiết bị không được để trống"),
});
export default function DeviceCode({
  open,
  setOpen,
  handleSubmit,
  selectedDeviceCode,
  minimizedData,
  onMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<DeviceCodeType>) => void;
  selectedDeviceCode: DeviceCodeType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
}) {
  const formik = useFormik({
    initialValues: {
      code: minimizedData ? minimizedData.code : (selectedDeviceCode ? selectedDeviceCode.code : ""),
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

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(formik.values);
    }
  };
  
  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedDeviceCode || minimizedData?._id) ? "Chỉnh sửa mã thiết bị" : "Tạo mới mã thiết bị"
      }
      breadcrumbs={["Danh mục", "Mã thiết bị"]}
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
            {(selectedDeviceCode || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
          Mã thiết bị
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <FieldInput formik={formik} field="code" />
        </Box>
    </BaseModal>
  );
}
