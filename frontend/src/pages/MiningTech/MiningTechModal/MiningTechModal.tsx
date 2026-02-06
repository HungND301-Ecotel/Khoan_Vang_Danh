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
import { PhaseGroupType } from "../../../types";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  code: yup.string().required("Mã công nghệ khai thác không được để trống"),
  name: yup.string().required("Tên công nghệ khai thác không được để trống"),
});

export default function PhaseGroupModal({
  open,
  setOpen,
  handleSubmit,
  selectedPhaseGroup,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<PhaseGroupType>) => void;
  selectedPhaseGroup: PhaseGroupType | null;
}) {
  const formik = useFormik({
    initialValues: {
      code: selectedPhaseGroup ? selectedPhaseGroup.code : "",
      name: selectedPhaseGroup ? selectedPhaseGroup.name : "",
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
          <Typography>Công đoạn sản xuất</Typography>
          <Typography>Nhóm công đoạn sản xuất</Typography>
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
          {selectedPhaseGroup
            ? "Chỉnh sửa Nhóm công đoạn sản xuất"
            : "Tạo mới Nhóm công đoạn sản xuất"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "700px",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã nhóm công đoạn
              </Typography>
              <FieldInput formik={formik} field="code" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên nhóm công đoạn
              </Typography>
              <FieldInput formik={formik} field="name" />
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
                {selectedPhaseGroup ? "Cập nhật" : "Xác nhận "}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
