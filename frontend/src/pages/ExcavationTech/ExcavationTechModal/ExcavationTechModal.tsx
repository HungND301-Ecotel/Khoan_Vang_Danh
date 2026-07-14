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
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { ExcavationTechType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Công nghệ xúc không được để trống"),
});

export default function ExcavationTechModal({
  open,
  setOpen,
  handleSubmit,
  selectedExcavationTech,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ExcavationTechType>) => void;
  selectedExcavationTech: ExcavationTechType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedExcavationTech ? selectedExcavationTech.name : ""),
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
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedExcavationTech?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedExcavationTech || minimizedData?._id) ? "Chỉnh sửa công nghệ xúc"
          : "Tạo mới công nghệ xúc"
      }
      breadcrumbs={["Danh mục", "Thông số", "Công nghệ xúc"]}
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
            {(selectedExcavationTech || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
        Công nghệ xúc
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <FieldInput formik={formik} field="name"></FieldInput>
      </Box>
    </BaseModal>
  );
}
