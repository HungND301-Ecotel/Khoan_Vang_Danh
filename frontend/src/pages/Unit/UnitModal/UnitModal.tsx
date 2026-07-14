// UnitModal.tsx
import { Box, Button, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { UnitType } from "../../../types";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Đơn vị tính không được để trống"),
});

export default function UnitModal({
  open,
  setOpen,
  handleSubmit,
  selectedUnit,
  minimizedData,
  onMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<UnitType>) => void;
  selectedUnit: UnitType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
}) {
  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedUnit ? selectedUnit.name : ""),
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

  const title = selectedUnit ? "Chỉnh sửa đơn vị tính" : "Tạo mới đơn vị tính";

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={title}
      breadcrumbs={["Danh mục", "Đơn vị tính"]}
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
            {(selectedUnit || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
        Đơn vị tính
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <FieldInput formik={formik} field="name" />
      </Box>
    </BaseModal>
  );
}
