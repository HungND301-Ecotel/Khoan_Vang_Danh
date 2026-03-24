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
import { ThicknessType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Chiều dốc vỉa không được để trống"),
});

export default function CurbSlopeModal({
  open,
  setOpen,
  handleSubmit,
  selectedCurbSlope,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ThicknessType>) => void;
  selectedCurbSlope: ThicknessType | null;
}) {
  const formik = useFormik({
    initialValues: {
      name: selectedCurbSlope ? selectedCurbSlope.name : "",
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
    <BaseModal
      open={open}
      onClose={handleClose}
      title={
        selectedCurbSlope
          ? "Chỉnh sửa độ dốc vỉa"
          : "Tạo mới độ dốc vỉa"
      }
      breadcrumbs={["Danh mục", "Thông số", "Độ dốc vỉa"]}
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
            {selectedCurbSlope ? "Cập nhật" : "Xác nhận"}
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
            Độ dốc vỉa
          </Typography>
          <FieldInput formik={formik} field="name" />
        </Box>
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {["≥", "≤", "<", ">", "%", "°", "="].map((symbol) => (
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
      </Box>
    </BaseModal>
  );
}
