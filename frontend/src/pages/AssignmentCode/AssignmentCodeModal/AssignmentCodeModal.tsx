import { Box, Button, DialogActions, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import {
  AssignmentCodeInputType,
  AssignmentCodeOutputType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  code: yup.string().required("Mã giao khoán không được để trống"),
  name: yup.string().required("Tên giao khoán không được để trống"),
});

export default function AssignmentCodeModal({
  open,
  setOpen,
  handleSubmit,
  selectedAssignmentCode,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentCodeInputType>) => void;
  selectedAssignmentCode: AssignmentCodeOutputType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
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
      code: minimizedData
        ? minimizedData.code
        : selectedAssignmentCode
          ? selectedAssignmentCode.code
          : "",
      name: minimizedData
        ? minimizedData.name
        : selectedAssignmentCode
          ? selectedAssignmentCode.name
          : "",
      uom: minimizedData
        ? minimizedData.uom
        : selectedAssignmentCode
          ? selectedAssignmentCode.uom?._id
          : "",
      deviceCode: minimizedData
        ? minimizedData.deviceCode
        : selectedAssignmentCode
          ? selectedAssignmentCode.deviceCode?._id
          : "",
      price: minimizedData
        ? minimizedData.price
        : selectedAssignmentCode
          ? selectedAssignmentCode.price
          : undefined,
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
    if (clearMinimize) {
      clearMinimize();
    }
  };
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(formik.values);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedAssignmentCode || minimizedData?._id) ? "Chỉnh sửa mã giao khoán"
          : "Tạo mới mã giao khoán"
      }
      breadcrumbs={["Danh mục", "Mã giao khoán"]}
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
            {(selectedAssignmentCode || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
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
        </Box>
      </Box>
    </BaseModal>
  );
}
