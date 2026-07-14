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
import { HardnessType, UnitType } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

const validationSchema = yup.object({
  name: yup.string().required("Vui lòng nhập độ cứng"),
});

export default function HardnessModal({
  open,
  setOpen,
  handleSubmit,
  selectedHardness,
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<HardnessType>) => void;
  selectedHardness: HardnessType | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}) {
  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async (): Promise<UnitType[]> => {
      const res = await api.get("/units");
      return res.data.data as UnitType[];
    },
  });

  const formik = useFormik({
    initialValues: {
      name: minimizedData ? minimizedData.name : (selectedHardness ? selectedHardness.name : ""),
      uom: minimizedData ? minimizedData.uom : (selectedHardness ? selectedHardness.uom?._id || "" : ""),
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const payload: Partial<HardnessType> = {
        name: values.name,
        uom: values.uom ? ({ _id: values.uom } as UnitType) : undefined,
      };
      handleSubmit(payload);
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedHardness?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedHardness || minimizedData?._id) ? "Chỉnh sửa độ cứng than, đá"
          : "Tạo mới độ cứng than, đá"
      }
      breadcrumbs={["Danh mục", "Thông số", "Độ cứng than, đá (f)"]}
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
            {(selectedHardness || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
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
            Độ cứng
          </Typography>
          <FieldInput field="name" formik={formik} />
        </Box>
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {["≥", "≤", "<", ">", "%", "°", "=", "-"].map((symbol) => (
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
