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
import { StepType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Bước chống không được để trống"),
});

export default function StepModal({
  open,
  setOpen,
  handleSubmit,
  selectedStep,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<StepType>) => void;
  selectedStep: StepType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedStep ? selectedStep.name : ""),
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
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedStep?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedStep || minimizedData?._id) ? "Chỉnh sửa bước chống"
          : "Tạo mới bước chống"
      }
      breadcrumbs={["Danh mục", "Thông số", "Bước chống"]}
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
            {(selectedStep || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
            Bước chống
          </Typography>
          <FieldInput formik={formik} field="name" />
        </Box>
      </Box>
    </BaseModal>
  );
}
