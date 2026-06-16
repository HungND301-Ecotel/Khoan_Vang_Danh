import { Box, Button, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { DepartmentType } from "../../../types";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  code: yup.string().required("Mã phân xưởng không được để trống"),
  name: yup.string().required("Tên phân xưởng không được để trống"),
});

export default function DepartmentModal({
  open,
  setOpen,
  handleSubmit,
  selectedDepartment,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<DepartmentType>) => void;
  selectedDepartment: DepartmentType | null;
}) {
  const formik = useFormik({
    initialValues: {
      code: selectedDepartment ? selectedDepartment.code : "",
      name: selectedDepartment ? selectedDepartment.name : "",
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

  const title = selectedDepartment ? "Chỉnh sửa phân xưởng" : "Tạo mới phân xưởng";

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={title}
      breadcrumbs={["Danh mục", "Phân xưởng"]}
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
            {selectedDepartment ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
        Mã phân xưởng <span style={{ color: "red" }}>*</span>
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <FieldInput formik={formik} field="code" />
      </Box>

      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
        Tên phân xưởng <span style={{ color: "red" }}>*</span>
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <FieldInput formik={formik} field="name" />
      </Box>
    </BaseModal>
  );
}
