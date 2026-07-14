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
import { Field, useFormik } from "formik";
import {
  CrossSectionOutputType,
  CrossSectionInputType,
  UnitType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Tiết diện lò xén không được để trống"),
});

export default function CrossSection({
  open,
  setOpen,
  handleSubmit,
  selectedCrossSection,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<CrossSectionInputType>) => void;
  selectedCrossSection: CrossSectionOutputType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const { data: units = { data: [] } } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedCrossSection ? selectedCrossSection.name : ""),
      uom: minimizedData ? minimizedData.uom : (selectedCrossSection ? selectedCrossSection.uom?._id : ""),
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
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedCrossSection?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedCrossSection || minimizedData?._id) ? "Chỉnh sửa tiết diện lò xén"
          : "Tạo mới tiết diện lò xén"
      }
      breadcrumbs={["Danh mục", "Thông số", "Tiết diện lò xén"]}
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
            {(selectedCrossSection || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
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
            Tiết diện lò xén
          </Typography>
          <FieldInput formik={formik} field="name" />
        </Box>
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {["≥", "≤", "<", ">", "%", "°", "=", "-", "+", "−"].map((symbol) => (
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
        <Box>
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
            Đơn vị tính
          </Typography>
          <FieldAutoCompleted
            formik={formik}
            field="uom"
            title=""
            labelkey="name"
            data={units.data}
          />
        </Box>
      </Box>
    </BaseModal>
  );
}
