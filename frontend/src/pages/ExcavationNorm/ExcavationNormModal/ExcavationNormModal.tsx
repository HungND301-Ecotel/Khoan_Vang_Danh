import { useQuery } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  ExcavationTechType,
  HardnessType,
  PhaseGroupType,
  PhaseOutputType,
  StepType,
} from "../../../types";

import * as yup from "yup";
import { CloudUpload } from "@mui/icons-material";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  phaseGroup: yup.string().required("Nhóm công đoạn không được để trống"),
  phase: yup.string().required("Công đoạn không được để trống"),
  excavationTech: yup.string().required("Công nghệ xúc không được để trống"),
  step: yup.string().required("Bước chống không được để trống"),
  // hardness: yup.string().required("Độ cứng không được để trống"),
  code: yup.string().required("Mã định mức không được để trống"),
  norms: yup
    .array()
    .of(
      yup.object().shape({
        assignmentCode: yup.string().required("Bắt buộc"),
        norm: yup.number().typeError("Phải là số").required("Bắt buộc"),
      }),
    )
    .min(1, "Chọn mã giao khoán"),
});

export default function ExcavationNormModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  hasExistingRecords,
  existingNorms,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentNormInputType>) => void;
  selected: AssignmentNormOutputType | null;
  hasExistingRecords: boolean;
  existingNorms: AssignmentNormOutputType[];
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);
  const [showAdditionalRows, setShowAdditionalRows] = useState(false);

  // State để lưu giá trị norm đầu tiên của cận trên và cận dưới
  const [upperLimitFirstNorm, setUpperLimitFirstNorm] = useState<number | null>(
    null,
  );
  const [lowerLimitFirstNorm, setLowerLimitFirstNorm] = useState<number | null>(
    null,
  );
  const [upperLimitPoint, setUpperLimitPoint] = useState<number | null>(null);
  const [lowerLimitPoint, setLowerLimitPoint] = useState<number | null>(null);
  const [predictingPoint, setPredictingPoint] = useState<number | null>(null);

  const { data: phasegroups = { data: [] } } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get("/phasegroups").then((res) => res.data.data),
  });

  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases", phaseGroup],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroup}`).then((res) => res.data.data),
    enabled: !!phaseGroup,
  });

  const { data: assignmentcodes = { data: [] } } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });

  const { data: steps = { data: [] } } = useQuery({
    queryKey: ["steps"],
    queryFn: async () => api.get(`/steps`).then((res) => res.data.data),
  });
  const { data: hardness = { data: [] } } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });

  const { data: excavationtechs = { data: [] } } = useQuery({
    queryKey: ["excavationtechs"],
    queryFn: () => api.get("/excavationtechs").then((res) => res.data.data),
  });

  // Hàm tính nội suy tuyến tính: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
  const handleInterpolationChange = (next?: {
    lowerLimitPoint?: number | null;
    upperLimitPoint?: number | null;
    lowerLimitFirstNorm?: number | null;
    upperLimitFirstNorm?: number | null;
    predictingPoint?: number | null;
  }) => {
    const x1 = next?.lowerLimitPoint ?? lowerLimitPoint;
    const y1 = next?.lowerLimitFirstNorm ?? lowerLimitFirstNorm;
    const x2 = next?.upperLimitPoint ?? upperLimitPoint;
    const y2 = next?.upperLimitFirstNorm ?? upperLimitFirstNorm;
    const x = next?.predictingPoint ?? predictingPoint;

    if (
      x1 != null &&
      y1 != null &&
      x2 != null &&
      y2 != null &&
      x != null &&
      x2 !== x1
    ) {
      const interpolated = y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
      formik.setFieldValue("interpolatedNorm", Number(interpolated));
    } else {
      formik.setFieldValue("interpolatedNorm", "");
    }
  };

  useEffect(() => {
    setPhaseGroup(
      phasegroups.data.find(
        (p: PhaseGroupType) => p.name?.toLowerCase() === "đào lò".toLowerCase(),
      )?._id,
    );
  }, [phasegroups]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: phaseGroup || "",
      phase: "",
      step: "",
      hardness: "",
      code: selected?.code || "",
      excavationTech: "",
      type: "excavation",
      interpolationMethod: "",
      predictingPoint: "",
      upperLimitNorm: "",
      upperLimitPoint: "",
      lowerLimitNorm: "",
      lowerLimitPoint: "",
      interpolatedNorm: "",
      norms: [] as any[],
      // assignmentcodes.data.map((item: any) => ({
      //   assignmentCode: item._id,
      //   norm: "",
      // })),
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit({
        ...values,
        hardness: values.hardness || undefined,
        type: values.type as
          | "excavation"
          | "cutting"
          | "coal_kb"
          | "coal_zh"
          | "coal_zry",
        norms: values?.norms
          ?.filter((item) => item.assignmentCode && item.norm)
          .map((item) => ({
            assignmentCode: item.assignmentCode,
            norm: item?.norm,
          })),
      });
    },
  });

  // Effect để lấy giá trị norm đầu tiên khi chọn cận trên
  useEffect(() => {
    if (formik.values.upperLimitNorm) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.upperLimitNorm,
      );
      if (selectedNorm && selectedNorm.norms && selectedNorm.norms.length > 0) {
        const firstNorm = selectedNorm.norms[0]?.norm;
        setUpperLimitFirstNorm(firstNorm ?? null);
      } else {
        setUpperLimitFirstNorm(null);
      }
    } else {
      setUpperLimitFirstNorm(null);
    }
  }, [formik.values.upperLimitNorm, existingNorms]);

  // Effect để lấy giá trị norm đầu tiên khi chọn cận dưới và prefill tất cả mã giao khoán
  useEffect(() => {
    if (formik.values.lowerLimitNorm) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.lowerLimitNorm,
      );
      if (selectedNorm && selectedNorm.norms && selectedNorm.norms.length > 0) {
        const firstNorm = selectedNorm.norms[0]?.norm;
        setLowerLimitFirstNorm(firstNorm ?? null);

        // Prefill tất cả các mã giao khoán với giá trị từ định mức cận dưới
        const updatedNorms = formik.values.norms.map((item: any) => {
          // Tìm norm tương ứng trong selectedNorm
          const matchingNorm = selectedNorm.norms.find(
            (n) => n.assignmentCode?._id === item.assignmentCode,
          );
          return {
            assignmentCode: item.assignmentCode,
            norm: matchingNorm?.norm ?? item.norm, // Giữ giá trị cũ nếu không tìm thấy
          };
        });
        formik.setFieldValue("norms", updatedNorms);
      } else {
        setLowerLimitFirstNorm(null);
      }
    } else {
      setLowerLimitFirstNorm(null);
    }
  }, [formik.values.lowerLimitNorm, existingNorms]);

  useEffect(() => {
    if (selected && selected.norms.length > 0 && open) {
      formik.setValues({
        ...formik.values,
        phase: selected?.phase?._id || "",
        step: selected?.step?._id || "",
        hardness: selected?.hardness?._id || "",
        code: selected?.code || "",
        excavationTech: selected?.excavationTech?._id || "",
        type: "excavation",
        norms:
          selected?.norms
            ?.filter((item) => item.assignmentCode?._id)
            .map((item) => ({
              assignmentCode: item.assignmentCode._id ?? "",
              norm: item.norm,
            })) || [],
      });
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id),
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else {
      setSelectedAssignmentCodes([]);
    }
  }, [selected, assignmentcodes.data, open]);

  // Khi interpolatedNorm thay đổi, tự động cập nhật toàn bộ định mức
  useEffect(() => {
    if (
      formik.values.interpolatedNorm &&
      lowerLimitFirstNorm &&
      formik.values.norms?.length > 0
    ) {
      const ratio =
        Number(formik.values.interpolatedNorm) / Number(lowerLimitFirstNorm);

      const updatedNorms = formik.values.norms.map((item: any) => {
        if (item.norm != null && !isNaN(Number(item.norm))) {
          return {
            ...item,
            norm: Number(Number(item.norm) * ratio),
          };
        }
        return item; // Nếu chưa có giá trị "Định mức" thì giữ nguyên
      });

      formik.setFieldValue("norms", updatedNorms);
    }
  }, [formik.values.interpolatedNorm, lowerLimitFirstNorm]);

  const handleClose = () => {
    formik.resetForm();
    setSelectedAssignmentCodes([]);
    setShowAdditionalRows(false);
    setUpperLimitFirstNorm(null);
    setLowerLimitFirstNorm(null);
    setOpen(false);
  };

  const handleImportData = (excelData: { code: string; norm: number }[]) => {
    // 1. Chuẩn hóa dữ liệu từ Excel: Lọc các mã giao khoán (code) có tồn tại
    const validNorms: any[] = [];
    const newSelectedCodes: AssignmentCodeOutputType[] = [];

    excelData.forEach((item) => {
      const matchingAssignmentCode = assignmentcodes.data.find(
        (ac: AssignmentCodeOutputType) => ac.code === item.code,
      );

      if (matchingAssignmentCode) {
        // Chỉ thêm nếu mã có tồn tại trong hệ thống
        validNorms.push({
          assignmentCode: matchingAssignmentCode._id,
          norm: item.norm,
        });
        newSelectedCodes.push(matchingAssignmentCode);
      }
    });

    // 2. Cập nhật State và Formik
    setSelectedAssignmentCodes(newSelectedCodes);
    formik.setFieldValue("norms", validNorms);

    // Đóng modal import sau khi hoàn tất
    setIsImportModalOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "800px",
          maxHeight: "90vh",
          p: "40px",
          backgroundColor: "#F1F2F5",
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

      <DialogTitle sx={{ p: 0 }}>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ fontSize: "14px", mb: "12px" }}
        >
          <Typography>Định mức</Typography>
          <Typography>Đào lò</Typography>
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
            Chỉnh sửa định mức đào lò
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới định mức đào lò
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowY: "auto" }}>
        <FormikProvider value={formik}>
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Nhóm công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={phasegroups.data}
              formik={formik}
              labelkey="name"
              field="phaseGroup"
              title=""
              onChange={(value: string) => {
                setPhaseGroup(value);
                formik.setFieldValue("phase", ""); // Reset công đoạn khi nhóm công đoạn thay đổi
              }}
              disabled={true}
            />
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={phases.data}
              formik={formik}
              labelkey="name"
              field="phase"
              title=""
            />
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Công nghệ xúc
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={excavationtechs.data}
              formik={formik}
              labelkey="name"
              field="excavationTech"
              title=""
            />
          </Box>

          {/* Chống - only show when checkbox is NOT checked */}
          {/* {!showAdditionalRows && ( */}
          <>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Chống
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <FieldAutoCompleted
                data={steps.data}
                formik={formik}
                labelkey="name"
                field="step"
                title=""
              />
            </Box>
          </>
          {/* )} */}

          {/* Độ cứng */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Độ cứng
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={hardness.data}
              formik={formik}
              labelkey="name"
              field="hardness"
              title=""
            />
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã định mức
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldInput formik={formik} field="code" />
          </Box>

          {/* Checkbox for additional rows */}
          {hasExistingRecords &&
            selectedAssignmentCodes &&
            selectedAssignmentCodes.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showAdditionalRows}
                      onChange={(e) => setShowAdditionalRows(e.target.checked)}
                      sx={{
                        color: "#007BFF",
                        "&.Mui-checked": {
                          color: "#007BFF",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "14px" }}>
                      Tạo định mức bảng phương pháp nội suy
                    </Typography>
                  }
                  sx={{ width: "700px" }}
                />
              </Box>
            )}

          {/* Additional rows - shown when checkbox is checked */}
          {showAdditionalRows && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Grid container spacing={2} sx={{ width: "700px" }}>
                  {/* Điểm nội suy */}
                  <Grid item xs={12}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Điểm nội suy
                    </Typography>
                    <FieldInput
                      formik={formik}
                      field="predictingPoint"
                      title=""
                      type="number"
                      onChange={(value) => {
                        setPredictingPoint(value);
                        handleInterpolationChange({
                          predictingPoint: value,
                        });
                      }}
                    />
                  </Grid>

                  {/* Định mức cận trên */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Định mức cận trên
                    </Typography>
                    <FieldAutoCompleted
                      data={existingNorms}
                      formik={formik}
                      labelkey="code"
                      field="upperLimitNorm"
                      title=""
                    />
                  </Grid>

                  {/* Điểm cận trên */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Điểm cận trên
                    </Typography>
                    <FieldInput
                      formik={formik}
                      field="upperLimitPoint"
                      title=""
                      type="number"
                      onChange={(value) => {
                        setUpperLimitPoint(value);
                        handleInterpolationChange({
                          upperLimitPoint: value,
                        });
                      }}
                    />
                  </Grid>

                  {/* Định mức cận dưới */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Định mức cận dưới
                    </Typography>
                    <FieldAutoCompleted
                      data={existingNorms}
                      formik={formik}
                      labelkey="code"
                      field="lowerLimitNorm"
                      title=""
                    />
                  </Grid>

                  {/* Điểm cận dưới */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Điểm cận dưới
                    </Typography>
                    <FieldInput
                      formik={formik}
                      field="lowerLimitPoint"
                      title=""
                      type="number"
                      onChange={(value) => {
                        setLowerLimitPoint(Number(value));
                        handleInterpolationChange({
                          lowerLimitPoint: Number(value),
                        });
                      }}
                    />
                  </Grid>

                  {/* Interpolated norm */}
                  {/* <Grid item xs={12}>
                           <Typography
                             sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                           >
                             Kết quả định mức nội suy
                           </Typography>
                           <TextField
                             fullWidth
                             value={formik.values.interpolatedNorm || ""}
                             placeholder="Tự động tính toán khi đủ dữ liệu"
                             disabled
                             variant="outlined"
                             sx={{
                               "& .MuiInputBase-root": {
                                 height: "32px",
                                 borderRadius: "6px",
                                 px: "12px",
                                 fontSize: "14px",
                                 backgroundColor: "#f5f5f5",
                               },
                               "& input::placeholder": {
                                 color: "#999",
                                 opacity: 1,
                               },
                             }}
                           />
                         </Grid> */}
                </Grid>
              </Box>
            </Box>
          )}
          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#6592B7",
              opacity: 0.3,
              borderWidth: "1px",
            }}
          />

          <Box
            display="flex"
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Mã giao khoán
            </Typography>
            <Button
              size="small"
              onClick={() => setIsImportModalOpen(true)}
              startIcon={<CloudUpload />}
              variant="outlined" // Sử dụng outlined hoặc text để tránh quá nổi bật
              sx={{
                textTransform: "none",
                fontSize: "12px",
                padding: "4px 8px",
                minWidth: "auto",
                borderColor: "#1976d2", // Màu primary của MUI
                color: "#1976d2",
                "&:hover": {
                  backgroundColor: "#e3f2fd", // Light blue background on hover
                  borderColor: "#1976d2",
                },
              }}
            >
              Tải lên
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <AppMultiAutocomplete
              // 1. Dữ liệu và hiển thị
              options={
                assignmentcodes.data?.filter(
                  (opt: AssignmentCodeOutputType) =>
                    !selectedAssignmentCodes.some(
                      (selected: AssignmentCodeOutputType) =>
                        selected._id === opt._id,
                    ),
                ) || []
              }
              value={selectedAssignmentCodes}
              getOptionLabel={(option) => `${option.code}`}
              placeholder="Chọn mã giao khoán"
              // 2. Logic thay đổi (giữ nguyên logic xử lý Formik của bạn)
              onChange={(newValue) => {
                setSelectedAssignmentCodes(newValue);
                const updatedNorms = newValue
                  .filter((item) => item._id)
                  .map((item) => {
                    const existing = formik.values.norms.find(
                      (n: any) => n.assignmentCode === item._id,
                    );
                    return {
                      assignmentCode: item._id,
                      norm: existing?.norm || "",
                    };
                  });
                formik.setFieldValue("norms", updatedNorms);
              }}
              // 3. Validation (Loosely coupled)
              error={
                formik.touched.norms && typeof formik.errors.norms === "string"
              }
              helperText={
                formik.touched.norms && typeof formik.errors.norms === "string"
                  ? formik.errors.norms
                  : undefined
              }
            />
          </Box>
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
                            assignmentcodes.data.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id ===
                                formik.values.norms[index].assignmentCode,
                            )?.code || ""
                          }
                          disabled
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
                            assignmentcodes.data.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id ===
                                formik.values.norms[index].assignmentCode,
                            )?.name || ""
                          }
                          disabled
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
                        <TextFieldNumber
                          formik={formik}
                          field={`norms.${index}.norm`}
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
      <SimpleImportModal
        open={isImportModalOpen}
        setOpen={setIsImportModalOpen}
        onImport={handleImportData}
        readExcelFile={readExcelFile}
      />
    </Dialog>
  );
}
