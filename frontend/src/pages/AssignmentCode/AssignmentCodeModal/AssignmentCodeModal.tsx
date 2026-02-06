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
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { Field, useFormik } from "formik";
import {
  AssignmentCodeInputType,
  AssignmentCodeOutputType,
  DeviceCodeType,
  UnitType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import { formattedPrice } from "../../../utils/helpers";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";

const validationSchema = yup.object({
  code: yup.string().required("Mã giao khoán không được để trống"),
  name: yup.string().required("Tên giao khoán không được để trống"),
});

export default function AssignmentCodeModal({
  open,
  setOpen,
  handleSubmit,
  selectedAssignmentCode,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentCodeInputType>) => void;
  selectedAssignmentCode: AssignmentCodeOutputType | null;
}) {
  const { data: units = { data: [] } } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });
  const { data: devicecodes = { data: [] } } = useQuery({
    queryKey: ["devicecodes"],
    queryFn: () => api.get("/devicecodes").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selectedAssignmentCode ? selectedAssignmentCode.code : "",
      name: selectedAssignmentCode ? selectedAssignmentCode.name : "",
      uom: selectedAssignmentCode ? selectedAssignmentCode.uom?._id : "",
      deviceCode: selectedAssignmentCode
        ? selectedAssignmentCode.deviceCode?._id
        : "",
      price: selectedAssignmentCode ? selectedAssignmentCode.price : undefined,
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
          <Typography>Mã giao khoán</Typography>
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
          {selectedAssignmentCode
            ? "Sửa mã giao khoán"
            : "Tạo mới mã giao khoán"}
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
                Mã giao khoán
              </Typography>
              <FieldInput formik={formik} field="code" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên mã giao khoán
              </Typography>
              <FieldInput formik={formik} field="name" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Đơn vị tính
              </Typography>
              <FieldAutoCompleted
                formik={formik}
                field="uom"
                labelkey="name"
                title=""
                data={units.data}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã thiết bị
              </Typography>
              <FieldAutoCompleted
                formik={formik}
                field="deviceCode"
                labelkey="code"
                title=""
                data={devicecodes.data}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Đơn giá
              </Typography>
              <TextFieldNumber formik={formik} field="price" disabled={true} />
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
                {selectedAssignmentCode ? "Cập nhật" : "Xác nhận"}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
