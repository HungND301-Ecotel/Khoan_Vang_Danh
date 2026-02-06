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

const validationSchema = yup.object({
  name: yup.string().required("Công nghệ xúc không được để trống"),
});

export default function ExcavationTechModal({
  open,
  setOpen,
  handleSubmit,
  selectedExcavationTech,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ExcavationTechType>) => void;
  selectedExcavationTech: ExcavationTechType | null;
}) {
  const formik = useFormik({
    initialValues: {
      name: selectedExcavationTech ? selectedExcavationTech.name : "",
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
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "800px",
          height: "740px",
          p: "40px",
          position: "relative",
          borderRadius: "12px",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "40px",
          right: "40px",
          width: "16px",
          height: "16px",
          opacity: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: "16px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mt: "16px" }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "14px" }}>
          <Typography>Danh mục</Typography>
          <Typography>Thông số</Typography>
          <Typography>Công nghệ xúc</Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography sx={{ fontSize: "24px", color: "#2B4A82" }}>
          {selectedExcavationTech
            ? "Chỉnh sửa công nghệ xúc"
            : "Tạo mới công nghệ xúc"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
          Công nghệ xúc
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <FieldInput formik={formik} field="name"></FieldInput>
        </Box>

        <DialogActions sx={{ mt: 3, px: 0, gap: "10px" }}>
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
            {selectedExcavationTech ? "Cập nhật" : "Xác nhận"}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
