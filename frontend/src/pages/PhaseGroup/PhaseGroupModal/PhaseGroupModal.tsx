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
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  code: yup.string().required("Mã nhóm công đoạn không được để trống"),
  name: yup.string().required("Tên nhóm công đoạn không được để trống"),
});

export default function PhaseGroupModal({
  open,
  setOpen,
  handleSubmit,
  selectedPhaseGroup,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<PhaseGroupType>) => void;
  selectedPhaseGroup: PhaseGroupType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const formik = useFormik({
    initialValues: {
      code: minimizedData ? minimizedData.code : (selectedPhaseGroup ? selectedPhaseGroup.code : ""),
      name: minimizedData ? minimizedData.name : (selectedPhaseGroup ? selectedPhaseGroup.name : ""),
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
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedPhaseGroup?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedPhaseGroup || minimizedData?._id) ? "Chỉnh sửa nhóm công đoạn sản xuẩt"
          : "Tạo mới nhóm công đoạn sản xuất"
      }
      breadcrumbs={[
        "Danh mục",
        "Công đoạn sản xuất",
        "Nhóm công đoạn sản xuất",
      ]}
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
            {(selectedPhaseGroup || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
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
      </Box>
    </BaseModal>
  );
}
