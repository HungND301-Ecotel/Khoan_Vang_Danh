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
import { MirrorRatioType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Tỉ lệ gương than mềm không được để trống"),
});

export default function MirrorRatioModal({
  open,
  setOpen,
  handleSubmit,
  selectedMirrorRatio,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MirrorRatioType>) => void;
  selectedMirrorRatio: MirrorRatioType | null;
}) {
  const formik = useFormik({
    initialValues: {
      name: selectedMirrorRatio ? selectedMirrorRatio.name : "",
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
      title={selectedMirrorRatio?"Chỉnh sửa tỉ lệ gương than mềm (Cm)":"Tạo mới tỉ lệ gương than mềm (Cm"}
      breadcrumbs={["Danh mục", "Tỉ lệ gương than mềm (Cm)"]}
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
            {selectedMirrorRatio ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <Box>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
          Tỉ lệ gương than mềm
        </Typography>
        <FieldInput formik={formik} field="name" />
      </Box>
      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {["≥", "≤", "<", ">", "%", "°", "=", "-", "_"].map((symbol) => (
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
    </BaseModal>
  );
}
