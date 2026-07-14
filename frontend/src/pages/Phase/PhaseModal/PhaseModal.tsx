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
import BaseModal from "../../../components/Common/BaseModal";

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
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<PhaseInputType>) => void;
  selectedPhase: PhaseOutputType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const { data: phasegroups = { data: [] } } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: () => api.get("/phasegroups").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: minimizedData ? minimizedData.code : (selectedPhase ? selectedPhase.code : ""),
      name: minimizedData ? minimizedData.name : (selectedPhase ? selectedPhase.name : ""),
      phaseGroup: minimizedData ? minimizedData.phaseGroup : (selectedPhase ? selectedPhase.phaseGroup?._id : ""),
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
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedPhase?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedPhase || minimizedData?._id) ? "Chỉnh sửa công đoạn sản xuẩt"
          : "Tạo mới công đoạn sản xuất"
      }
      breadcrumbs={["Danh mục", "Công đoạn sản xuất", "Công đoạn sản xuất"]}
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
            {(selectedPhase || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
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
      </Box>
    </BaseModal>
  );
}
