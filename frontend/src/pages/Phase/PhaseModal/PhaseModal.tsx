import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import {
  PhaseGroupType,
  PhaseInputType,
  PhaseOutputType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  code: yup.string().required("Mã công đoạn không được để trống"),
  name: yup.string().required("Tên công đoạn không được để trống"),
  phaseGroup: yup.string().required("Mã nhóm công đoạn không được để trống"),
});

export default function PhaseModal({
  open,
  setOpen,
  handleSubmit,
  selectedPhase,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<PhaseInputType>) => void;
  selectedPhase: PhaseOutputType | null;
}) {
  const { data: phasegroups = { data: [] } } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: () => api.get("/phasegroups").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selectedPhase ? selectedPhase.code : "",
      name: selectedPhase ? selectedPhase.name : "",
      phaseGroup: selectedPhase ? selectedPhase.phaseGroup?._id : "",
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
          <Typography>Công đoạn sản xuất</Typography>
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
          {selectedPhase
            ? "Chỉnh sửa Công đoạn sản xuất"
            : "Tạo mới Công đoạn sản xuất"}
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
                Nhóm công đoạn
              </Typography>

              <FieldAutoCompleted
                formik={formik}
                field="phaseGroup"
                title=""
                labelkey="name"
                data={phasegroups.data}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã công đoạn
              </Typography>
              <FieldInput formik={formik} field="code" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên công đoạn
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
                {selectedPhase ? "Cập nhật" : "Xác nhận "}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
