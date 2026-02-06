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

const validationSchema = yup.object({
  name: yup.string().required("Vui lòng nhập độ cứng"),
});

export default function HardnessModal({
  open,
  setOpen,
  handleSubmit,
  selectedHardness,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<HardnessType>) => void;
  selectedHardness: HardnessType | null;
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
      name: selectedHardness ? selectedHardness.name : "",
      uom: selectedHardness ? selectedHardness.uom?._id || "" : "",
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
          <Typography>Độ cứng than/ đá (f)</Typography>
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
          {selectedHardness
            ? "Chỉnh sửa Độ cứng than/đá"
            : "Tạo mới Độ cứng than/đá"}
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
                {selectedHardness ? "Cập nhật" : "Xác nhận"}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
