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
import { LengthType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Chiều dài lò không được để trống"),
});

export default function LengthModal({
  open,
  setOpen,
  handleSubmit,
  selectedLength,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<LengthType>) => void;
  selectedLength: LengthType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedLength ? selectedLength.name : ""),
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
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedLength?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedLength || minimizedData?._id) ? "Chỉnh sửa chiều dài lò" : "Tạo mới chiều dài lò"}
      breadcrumbs={["Danh mục", "Thông số", "Chiều dài lò"]}
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
            {(selectedLength || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
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
            Chiều dài lò
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
