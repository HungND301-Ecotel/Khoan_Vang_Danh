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
import { Divider } from "antd";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FormikProvider, useFormik, FieldArray } from "formik";
import { Autocomplete } from "@mui/material";
import api from "../../../config/api.config";
import {
  ProductionScopeInputType,
  ProductionScopeOutputType,
  PhaseInputType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import BaseModal from "../../../components/Common/BaseModal";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  code: yup.string().required("Mã diện sản xuất không được để trống"),
  name: yup.string().required("Tên diện sản xuất không được để trống"),
  phases: yup.array().min(1, "Phải chọn ít nhất một công đoạn"),
});

export default function ProductionScopeModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<ProductionScopeInputType>) => void;
  selected: ProductionScopeOutputType | null;
}) {
  const [selectedPhases, setSelectedPhases] = useState<PhaseInputType[]>([]);

  const { data: phases = { totalDocs: 0, data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get(`/phases`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selected?.code || "",
      name: selected?.name || "",
      phases:
        selected?.phases?.map((item) => ({
          phase: item.phase?._id,
          // production: item.production,
        })) || [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  useEffect(() => {
    // if (phases.totalDocs === 0) return;

    if (selected && selected.phases.length > 0) {
      const selectedCodes = phases.data.filter((ac: any) =>
        selected.phases.some((norm) => norm.phase?._id === ac._id),
      );
      setSelectedPhases(selectedCodes);
    }
  }, [selected, phases]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    setSelectedPhases([]);
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={selected ? "Chỉnh sửa diện sản xuất" : "Tạo mới diện sản xuất"}
      breadcrumbs={["Danh mục", "Thông số", "Diện sản xuất"]}
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
            {selected ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Mã diện sản xuất <span style={{ color: "red" }}>*</span>
            </Typography>
            <FieldInput formik={formik} field="code" />
          </Box>

          {/* Tên diện sản xuất */}
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Tên diện sản xuất <span style={{ color: "red" }}>*</span>
            </Typography>
            <FieldInput formik={formik} field="name" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Công đoạn
            </Typography>
            <Autocomplete
              multiple
              size="small"
              options={phases.data.filter(
                (opt: PhaseInputType) =>
                  !selectedPhases.some((selected) => selected._id === opt._id),
              )}
              getOptionLabel={(option: PhaseInputType) => option.code || ""}
              value={selectedPhases}
              onChange={(event, newValue) => {
                setSelectedPhases(newValue);
                const updatedNorms = newValue.map((item) => {
                  const existing = formik.values.phases.find(
                    (n: any) => n.phase === item._id,
                  );
                  return {
                    phase: item._id,
                    // production: existing?.production || undefined,
                  };
                });
                formik.setFieldValue("phases", updatedNorms);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Chọn công đoạn"
                  variant="outlined"
                  size="small"
                  error={
                    formik.touched.phases &&
                    Boolean(formik.errors.phases) &&
                    typeof formik.errors.phases === "string" // CHỈ BÁO LỖI NẾU LÀ CHUỖI
                  }
                  helperText={
                    formik.touched.phases &&
                    typeof formik.errors.phases === "string"
                      ? formik.errors.phases // TRUYỀN CHUỖI VÀO helperText
                      : undefined // Nếu là mảng lỗi, không truyền gì cả (tránh lỗi Type)
                  }
                />
              )}
            />
          </Box>
          <FieldArray name="phases">
            {({ push, remove }) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {formik.values.phases.map((item: any, index: number) => {
                  const phase = phases.data.find(
                    (pg: PhaseInputType) => pg._id === item.phase,
                  );
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: 1.5,
                        alignItems: "center",
                        width: "100%",
                        paddingLeft: "20px", // Thêm padding bên trái để lùi vào
                      }}
                    >
                      {/* Mã công đoạn */}
                      <Box sx={{ marginLeft: "10px" }}>
                        {" "}
                        {/* Thêm margin-left để lùi vào thêm */}
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
                        >
                          Mã công đoạn
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={phase?.code || ""}
                          InputLabelProps={{ shrink: true }}
                          disabled
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              paddingRight: "12px",
                              paddingLeft: "12px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
                        >
                          Tên công đoạn
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={phase?.name || ""}
                          InputLabelProps={{ shrink: true }}
                          disabled
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              paddingRight: "12px",
                              paddingLeft: "12px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Box>

                      {/* Sản lượng
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 0.5,
                              }}
                            >
                              Sản lượng
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Input Text"
                              type="number"
                              value={
                                formik.values.phases[index]?.production || ""
                              }
                              onChange={(e) =>
                                formik.setFieldValue(
                                  `phases[${index}].production`,
                                  e.target.value
                                )
                              }
                              sx={{
                                "& .MuiInputBase-root": {
                                  minHeight: "32px",
                                  borderRadius: "6px",
                                  paddingRight: "12px",
                                  paddingLeft: "12px",
                                  fontSize: "14px",
                                },
                              }}
                            />
                          </Box> */}

                      {/* Đơn vị tính
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 0.5,
                              }}
                            >
                              Đơn vị tính
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={phase?.unit || "Chưa có đơn vị"}
                              InputLabelProps={{ shrink: true }}
                              disabled
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: "32px",
                                  borderRadius: "6px",
                                  paddingRight: "12px",
                                  paddingLeft: "12px",
                                  fontSize: "14px",
                                },
                              }}
                            />
                          </Box> */}

                      {/* Nút xóa */}
                      <IconButton
                        onClick={() => {
                          const updatedPhases = selectedPhases.filter(
                            (phase) =>
                              phase._id !== formik.values.phases[index].phase,
                          );
                          setSelectedPhases(updatedPhases);
                          remove(index);
                        }}
                        sx={{
                          mt: 2.5,
                          width: 24,
                          height: 24,
                          color: "#666",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </FieldArray>
        </Box>
      </FormikProvider>
    </BaseModal>
  );
}
