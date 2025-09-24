import { useQuery } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../config/api.config";
import {
  AssignmentCodeOutputType,
  CrossSectionInputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  ExcavationTechType,
  HardnessType,
  PhaseGroupType,
  PhaseOutputType,
  StepType,
  ThicknessType,
  LengthType,
} from "../../types";

const validationSchema = yup.object().shape({
  hardness: yup.string().required("Độ cứng là bắt buộc"),
  code: yup.string().required("Mã định mức là bắt buộc"),
  curbSlope: yup.string().required("Độ dốc vỉa là bắt buộc"),
  thickness: yup.string().required("Độ dày vỉa là bắt buộc"),
  norms: yup
    .array()
    .of(
      yup.object().shape({
        assignmentCode: yup.string().required("Bắt buộc"),
        norm: yup
          .number()
          .typeError("Phải là số")
          .required("Bắt buộc")
          .min(0, "Định mức phải lớn hơn hoặc bằng 0"),
      })
    )
    .min(1, "Phải có ít nhất 1 định mức"),
});

export default function CuttingNormKBModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentNormInputType>) => void;
  selected: AssignmentNormOutputType | null;
}) {
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);

  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: hardness = [] } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });
  const { data: thickness = [] } = useQuery({
    queryKey: ["thickness"],
    queryFn: async () => api.get(`/thickness`).then((res) => res.data.data),
  });
  const { data: curbslopes = [] } = useQuery({
    queryKey: ["curbslopes"],
    queryFn: async () => api.get(`/curbslopes`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      hardness: selected?.hardness?._id || "",
      code: selected?.code || "",
      curbSlope: selected?.curbSlope?._id || "",
      thickness: selected?.thickness?._id || "",
      type: "coal_zh",
      norms:
        selected?.norms?.map((item) => ({
          assignmentCode: item.assignmentCode?._id,
          norm: item.norm,
        })) || [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {

      try {
        // Kiểm tra xem form có hợp lệ không
        if (!formik.isValid) {
          console.log("Form không hợp lệ, không thể submit");
          return;
        }

        await handleSubmit({
          ...values,
          hardness: values.hardness || undefined,
          type: values.type as
            | "excavation"
            | "cutting"
            | "coal_kb"
            | "coal_zh"
            | "coal_zry",
          norms: values.norms.map((item) => ({
            assignmentCode: item.assignmentCode || "",
            norm: item.norm,
          })),
        });

        // Đóng modal sau khi submit thành công
        setOpen(false);
      } catch (error) {
        console.error("Submit error:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      // Trường hợp sửa
      const selectedCodes = assignmentcodes.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else {
      // Trường hợp tạo mới: chọn tất cả assignment codes
      setSelectedAssignmentCodes(assignmentcodes);
      // Khởi tạo norms với tất cả assignment codes
      const initialNorms = assignmentcodes.map((item: any) => ({
        assignmentCode: item._id,
        norm: "",
      }));
      formik.setFieldValue("norms", initialNorms);
    }
  }, [selected, assignmentcodes]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  // Hàm xử lý khi thay đổi Autocomplete
  const handleAssignmentCodesChange = (
    event: any,
    newValue: AssignmentCodeOutputType[]
  ) => {
    setSelectedAssignmentCodes(newValue);

    // Cập nhật norms array dựa trên các assignment code được chọn
    const updatedNorms = newValue.map((item) => {
      const existingNorm = formik.values.norms.find(
        (n: any) => n.assignmentCode === item._id
      );
      return {
        assignmentCode: item._id,
        norm: existingNorm?.norm || "",
      };
    });

    formik.setFieldValue("norms", updatedNorms);
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
          backgroundColor: "#F1F2F5",
        },
      }}
    >
      {/* Nút X góc trên phải */}
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

      <DialogTitle sx={{ p: 0 }}>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ fontSize: "14px", mb: "12px" }}
        >
          <Typography>Định mức</Typography>
          <Typography>Khấu than</Typography>
          <Typography>ZH</Typography>
        </Breadcrumbs>

        <Divider
          sx={{
            mb: "12px",
            borderColor: "#6592B7",
            opacity: 0.3,
            borderWidth: "1px",
          }}
        />

        {selected ? (
          <Typography sx={{ fontSize: "24px", color: "#2B4A82" }}>
            Chỉnh sửa định mức khấu than
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới định mức khấu than
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <FormikProvider value={formik}>
          {/* Độ dày vỉa */}
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Độ dày vỉa
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.thickness || ""}
              onChange={(event) => {
                formik.setFieldValue("thickness", event.target.value);
              }}
              onBlur={formik.handleBlur}
              error={
                formik.touched.thickness && Boolean(formik.errors.thickness)
              }
              helperText={formik.touched.thickness && formik.errors.thickness}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.thickness ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Placeholder
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.thickness
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.thickness ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    formik.touched.thickness && formik.errors.thickness
                      ? "red"
                      : "#D9D9D9",
                },
              }}
            >
              <MenuItem value="">Chọn độ dày vỉa</MenuItem>
              {thickness?.map((item: ThicknessType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Độ dốc vỉa */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Độ dốc vỉa
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.curbSlope || ""}
              onChange={(event) =>
                formik.setFieldValue("curbSlope", event.target.value)
              }
              onBlur={formik.handleBlur}
              error={
                formik.touched.curbSlope && Boolean(formik.errors.curbSlope)
              }
              helperText={formik.touched.curbSlope && formik.errors.curbSlope}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.curbSlope ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Placeholder
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.curbSlope
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.curbSlope ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    formik.touched.curbSlope && formik.errors.curbSlope
                      ? "red"
                      : "#D9D9D9",
                },
              }}
            >
              <MenuItem value="">Chọn độ dốc vỉa</MenuItem>
              {curbslopes?.map((item: LengthType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Độ cứng */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Độ cứng
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.hardness || ""}
              onChange={(event) =>
                formik.setFieldValue("hardness", event.target.value)
              }
              onBlur={formik.handleBlur}
              error={formik.touched.hardness && Boolean(formik.errors.hardness)}
              helperText={formik.touched.hardness && formik.errors.hardness}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.hardness ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Placeholder
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.hardness
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.hardness ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    formik.touched.hardness && formik.errors.hardness
                      ? "red"
                      : "#D9D9D9",
                },
              }}
            >
              <MenuItem value="">Chọn độ cứng</MenuItem>
              {hardness?.map((item: HardnessType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Mã định mức */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã định mức
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              value={formik.values.code || ""}
              placeholder="Nhập mã định mức"
              onChange={(event) =>
                formik.setFieldValue("code", event.target.value)
              }
              onBlur={formik.handleBlur}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
              variant="outlined"
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.code ? "#F2F2F2" : "#FFFFFF",
                },
                "& input::placeholder": {
                  color: "#000000",
                  opacity: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    formik.touched.code && formik.errors.code
                      ? "red"
                      : "#D9D9D9",
                },
              }}
            />
          </Box>

          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#6592B7",
              opacity: 0.3,
              borderWidth: "1px",
            }}
          />

          {/* Mã giao khoán */}
          <Typography
            sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: "12px" }}
          >
            Mã giao khoán
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Autocomplete
              multiple
              options={assignmentcodes}
              getOptionLabel={(option: AssignmentCodeOutputType) =>
                option.code || ""
              }
              value={selectedAssignmentCodes}
              onChange={handleAssignmentCodesChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  error={formik.touched.norms && Boolean(formik.errors.norms)}
                  helperText={
                    formik.touched.norms &&
                    typeof formik.errors.norms === "string"
                      ? formik.errors.norms
                      : ""
                  }
                />
              )}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  minHeight: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor:
                    selectedAssignmentCodes.length > 0 ? "#F2F2F2" : "#FFFFFF",
                  "& .MuiAutocomplete-input": {
                    padding: "0 !important",
                    lineHeight: "26px",
                    textIndent: "12px",
                  },
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiChip-root": {
                  height: "20px",
                  fontSize: "12px",
                  margin: "2px",
                  lineHeight: "26px",
                  verticalAlign: "middle",
                  transform: "translateY(-6px)",
                },
                "& input::placeholder": {
                  color: "#D9D9D9",
                  opacity: 1,
                  lineHeight: "32px",
                  fontSize: "14px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    formik.touched.norms && formik.errors.norms
                      ? "red"
                      : "#D9D9D9",
                },
              }}
            />
          </Box>

          {/* Hiển thị lỗi tổng của norms */}
          {formik.errors.norms && typeof formik.errors.norms === "string" && (
            <Typography
              color="error"
              sx={{ fontSize: "12px", mt: 1, textAlign: "center" }}
            >
              {formik.errors.norms}
            </Typography>
          )}

          <FieldArray name="norms">
            {() => (
              <Box
                sx={{
                  mt: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {formik.values.norms.map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "center" }}
                  >
                    <Grid container spacing={2} sx={{ width: "700px" }}>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Mã giao khoán
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            assignmentcodes.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id === item.assignmentCode
                            )?.code || ""
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: "#F2F2F2",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Tên vật tư, tài sản
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            assignmentcodes.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id === item.assignmentCode
                            )?.name || ""
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: "#F2F2F2",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Định mức
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          name={`norms[${index}].norm`}
                          value={item.norm || ""}
                          onChange={(e) => {
                            formik.setFieldValue(
                              `norms[${index}].norm`,
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            );
                          }}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.norms?.[index]?.norm &&
                            typeof formik.errors.norms?.[index] === "object" &&
                            Boolean(
                              (formik.errors.norms?.[index] as { norm?: any })
                                ?.norm
                            )
                          }
                          helperText={
                            formik.touched.norms?.[index]?.norm &&
                            formik.errors.norms?.[index] &&
                            typeof formik.errors.norms[index] === "object" &&
                            (formik.errors.norms[index] as any)?.norm
                          }
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: item.norm
                                ? "#F2F2F2"
                                : "#FFFFFF",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor:
                                formik.touched.norms?.[index]?.norm &&
                                formik.errors.norms?.[index] &&
                                typeof formik.errors.norms[index] ===
                                  "object" &&
                                (formik.errors.norms[index] as any)?.norm
                                  ? "red"
                                  : "#D9D9D9",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            )}
          </FieldArray>

          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#6592B7",
              opacity: 0.3,
              borderWidth: "1px",
            }}
          />
        </FormikProvider>
      </DialogContent>

      <DialogActions sx={{ px: 0, gap: "10px" }}>
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
          onClick={() => formik.handleSubmit()}
          variant="contained"
          disabled={!formik.isValid || formik.isSubmitting}
          sx={{
            backgroundColor: formik.isValid ? "#007BFF" : "#ccc",
            borderRadius: "8px",
            height: "32px",
            minWidth: "91px",
            fontSize: "14px",
            textTransform: "none",
            "&:disabled": {
              backgroundColor: "#ccc",
              color: "#666",
              cursor: "not-allowed",
            },
          }}
        >
          {formik.isSubmitting
            ? "Đang xử lý..."
            : selected
            ? "Cập nhật"
            : "Xác nhận"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
