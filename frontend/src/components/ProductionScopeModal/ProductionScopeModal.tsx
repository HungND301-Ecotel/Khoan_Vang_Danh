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
import api from "../../config/api.config";
import {
  ProductionScopeInputType,
  ProductionScopeOutputType,
  PhaseGroupType,
} from "../../types";
import { useQuery } from "@tanstack/react-query";

const validationSchema = yup.object({
  code: yup.string().required("Mã diện sản xuất không được để trống"),
  name: yup.string().required("Tên diện sản xuất không được để trống"),
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
  const [selectedPhases, setSelectedPhases] = useState<PhaseGroupType[]>([]);

  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get(`/phasegroups`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selected?.code || "",
      name: selected?.name || "",
      phases:
        selected?.phases?.map((item) => ({
          phase: item.phase?._id,
          production: item.production,
        })) || [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  useEffect(() => {
    if (phasegroups.length === 0) return;

    if (selected && selected.phases.length > 0) {
      const selectedCodes = phasegroups.filter((ac: any) =>
        selected.phases.some((norm) => norm.phase?._id === ac._id)
      );
      setSelectedPhases(selectedCodes);
    }
  }, [selected, phasegroups]);

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
          // width: "817px",
          maxWidth: "817px",
          height: "740px",
          p: "40px",
          position: "relative",
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
          <Typography>Diện sản xuất</Typography>
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
          {selected ? "Sửa diện sản xuất" : "Tạo mới diện sản xuất"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 3 }}>
        <FormikProvider value={formik}>
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
                  Mã diện sản xuất <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  id="code"
                  name="code"
                  placeholder="Input Text"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  error={formik.touched.code && Boolean(formik.errors.code)}
                  helperText={formik.touched.code && formik.errors.code}
                  variant="outlined"
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
              </Box>

              {/* Tên diện sản xuất */}
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Tên diện sản xuất <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  placeholder="Input Text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  variant="outlined"
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
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Công đoạn
                </Typography>
                <Autocomplete
                  multiple
                  options={phasegroups.filter(
                    (opt: PhaseGroupType) =>
                      !selectedPhases.some(
                        (selected) => selected._id === opt._id
                      )
                  )}
                  getOptionLabel={(option: PhaseGroupType) => option.name || ""}
                  value={selectedPhases}
                  onChange={(event, newValue) => {
                    setSelectedPhases(newValue);
                    const updatedNorms = newValue.map((item) => {
                      const existing = formik.values.phases.find(
                        (n: any) => n.phase === item._id
                      );
                      return {
                        phase: item._id,
                        production: existing?.production || undefined,
                      };
                    });
                    formik.setFieldValue("phases", updatedNorms);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Chọn công đoạn"
                      variant="outlined"
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
                  )}
                />
              </Box>
              <FieldArray name="phases">
                {({ push, remove }) => (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {formik.values.phases.map((item: any, index: number) => {
                      const phase = phasegroups.find(
                        (pg: PhaseGroupType) => pg._id === item.phase
                      );
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
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
                          </Box>
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
                          </Box>

                          {/* Nút xóa */}
                          <IconButton
                            onClick={() => {
                              const updatedPhases = selectedPhases.filter(
                                (phase) =>
                                  phase._id !==
                                  formik.values.phases[index].phase
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
                  {selected ? "Cập nhật" : "Xác nhận"}
                </Button>
              </DialogActions>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}
