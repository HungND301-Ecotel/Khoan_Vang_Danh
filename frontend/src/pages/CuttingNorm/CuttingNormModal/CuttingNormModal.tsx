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
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  CrossSectionInputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  HardnessType,
  PhaseGroupType,
  PhaseOutputType,
} from "../../../types";
import * as yup from "yup";
import { CloudUpload } from "@mui/icons-material";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";

const validationSchema = yup.object({
  phaseGroup: yup.string().required("Nhóm công đoạn không được để trống"),
  phase: yup.string().required("Công đoạn không được để trống"),
  crossSection: yup.string().required("Tiết diện lò xén không được để trống"),
  hardness: yup.string().required("Độ cứng không được để trống"),
  code: yup.string().required("Mã định mức không được để trống"),
  norms: yup
    .array()
    .of(
      yup.object().shape({
        assignmentCode: yup.string().required("Bắt buộc"),
        norm: yup.number().typeError("Phải là số").required("Bắt buộc"),
      })
    )
    .min(1, "Chọn mã giao khoán"),
});

export default function CuttingNormModal({
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

  // interpolation states (mirrors ExcavationNormModal behavior)
  const [upperLimitFirstNorm, setUpperLimitFirstNorm] = useState<number | null>(
    null
  );
  const [lowerLimitFirstNorm, setLowerLimitFirstNorm] = useState<number | null>(
    null
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
  const { data: hardness = { data: [] } } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });
  const { data: crosssections = { data: [] } } = useQuery({
    queryKey: ["crosssections"],
    queryFn: () => api.get("/crosssections").then((res) => res.data.data),
  });

  useEffect(() => {
    setPhaseGroup(
      phasegroups.data.find(
        (p: PhaseGroupType) => p.name?.toLowerCase() === "xén lò".toLowerCase()
      )?._id
    );
  }, [phasegroups]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: phaseGroup || "",
      phase: selected?.phase?._id || "",
      hardness: selected?.hardness?._id || "",
      code: selected?.code || "",
      crossSection: selected?.crossSection?._id || "",
      type: "cutting",
      interpolationMethod: "",
      predictingPoint: "",
      upperLimitNorm: "",
      upperLimitPoint: "",
      lowerLimitNorm: "",
      lowerLimitPoint: "",
      interpolatedNorm: "",
      norms:
        selected?.norms && selected.norms.length > 0
          ? selected.norms.map((item) => ({
            assignmentCode: item.assignmentCode?._id ?? "",
            norm: item.norm,
          }))
          : [],
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
  useEffect(() => {
    // if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    }
  }, [selected, assignmentcodes.data]);

  // Effect to set upperLimitFirstNorm when an upper limit norm (existing norm) is chosen
  useEffect(() => {
    if (formik.values.upperLimitNorm && existingNorms) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.upperLimitNorm
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

  // Effect to set lowerLimitFirstNorm and prefill norms when a lower limit norm is chosen
  useEffect(() => {
    if (formik.values.lowerLimitNorm && existingNorms) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.lowerLimitNorm
      );
      if (selectedNorm && selectedNorm.norms && selectedNorm.norms.length > 0) {
        const firstNorm = selectedNorm.norms[0]?.norm;
        setLowerLimitFirstNorm(firstNorm ?? null);

        // Prefill all assignment codes norms from selected lower-limit existing norm
        const updatedNorms = formik.values.norms.map((item: any) => {
          const matchingNorm = selectedNorm.norms.find(
            (n) => n.assignmentCode?._id === item.assignmentCode
          );
          return {
            assignmentCode: item.assignmentCode,
            norm: matchingNorm?.norm ?? item.norm,
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
    // if (!assignmentcodes || assignmentcodes.totalDocs === 0) return;

    // Mỗi khi selectedAssignmentCodes thay đổi → cập nhật lại formik.norms
    const updatedNorms = selectedAssignmentCodes.map((item: any) => {
      const existing = formik.values.norms.find(
        (n: any) => n.assignmentCode === item._id
      );
      return {
        assignmentCode: item._id,
        norm: existing?.norm ?? undefined,
      };
    });

    formik.setFieldValue("norms", updatedNorms);
  }, [selectedAssignmentCodes]);

  // Interpolation helper: compute interpolated norm and set to formik
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
      const rounded = Number(interpolated);
      formik.setFieldValue("interpolatedNorm", rounded);
    } else {
      formik.setFieldValue("interpolatedNorm", "");
    }
  };

  const handleClose = () => {
    formik.resetForm();
    setSelectedAssignmentCodes([]);
    setShowAdditionalRows(false);
    setUpperLimitFirstNorm(null);
    setLowerLimitFirstNorm(null);
    setOpen(false);
  };

  // When interpolatedNorm changes, update all norms proportionally (if lowerLimitFirstNorm present)
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
            norm: Number((Number(item.norm) * ratio)),
          };
        }
        return item;
      });

      formik.setFieldValue("norms", updatedNorms);
    }
  }, [formik.values.interpolatedNorm, lowerLimitFirstNorm]);

  const handleImportData = (excelData: { code: string; norm: number }[]) => {
    // 1. Chuẩn hóa dữ liệu từ Excel: Lọc các mã giao khoán (code) có tồn tại
    const validNorms: any[] = [];
    const newSelectedCodes: AssignmentCodeOutputType[] = [];

    excelData.forEach(item => {
      const matchingAssignmentCode = assignmentcodes.data.find(
        (ac: AssignmentCodeOutputType) => ac.code === item.code
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
          height: "740px",
          p: "40px",
          backgroundColor: "#F1F2F5",
          borderRadius: '12px'
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
          <Typography>Xén lò</Typography>
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
            Chỉnh sửa định mức xén lò
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới định mức xén lò
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <FormikProvider value={formik}>
          {/* Nhóm công đoạn */}
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Nhóm công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.phaseGroup || ""}
              onChange={(event) => {
                setPhaseGroup(event.target.value);
                formik.setFieldValue("phaseGroup", event.target.value);
                formik.setFieldValue("phase", ""); // Reset phase when phase group changes
              }}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.phaseGroup ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Chọn nhóm công đoạn
                  </InputAdornment>
                ),
              }}
              error={
                formik.touched.phaseGroup && Boolean(formik.errors.phaseGroup)
              }
              helperText={formik.touched.phaseGroup && formik.errors.phaseGroup}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.phaseGroup
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.phaseGroup ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
                "& .MuiSelect-select": {
                  padding: "6px 12px",
                },
              }}
            >
              {phasegroups?.data
                .filter((group: PhaseGroupType | null) => group)
                .map((group: PhaseGroupType) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
            </TextField>
          </Box>

          {/* Công đoạn */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.phase || ""}
              onChange={(event) =>
                formik.setFieldValue("phase", event.target.value)
              }
              variant="outlined"
              // disabled={!formik.values.phase}
              InputProps={{
                startAdornment: formik.values.phase ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    {formik.values.phaseGroup
                      ? "Chọn công đoạn"
                      : "Chọn nhóm công đoạn trước"}
                  </InputAdornment>
                ),
              }}
              error={formik.touched.phase && Boolean(formik.errors.phase)}
              helperText={formik.touched.phase && formik.errors.phase}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.phase ? "#F2F2F2" : "#FFFFFF",
                  "&.Mui-disabled": {
                    backgroundColor: "#F5F5F5",
                  },
                },
                "& .MuiInputBase-input": {
                  color: formik.values.phase ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
                "& .MuiSelect-select": {
                  padding: "6px 12px",
                },
              }}
            >
              {phases?.data.map((phase: PhaseOutputType) => (
                <MenuItem key={phase._id} value={phase._id}>
                  {phase.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Tiết diện lò xén */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Tiết diện lò xén
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.crossSection || ""}
              onChange={(event) =>
                formik.setFieldValue("crossSection", event.target.value)
              }
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.crossSection ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Chọn tiết diện
                  </InputAdornment>
                ),
              }}
              error={
                formik.touched.crossSection &&
                Boolean(formik.errors.crossSection)
              }
              helperText={
                formik.touched.crossSection && formik.errors.crossSection
              }
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.crossSection
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.crossSection ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
                "& .MuiSelect-select": {
                  padding: "6px 12px",
                },
              }}
            >
              {crosssections?.data.map(
                (crosssection: CrossSectionInputType) => (
                  <MenuItem key={crosssection._id} value={crosssection._id}>
                    {crosssection.name}
                  </MenuItem>
                )
              )}
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
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.hardness ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Chọn độ cứng
                  </InputAdornment>
                ),
              }}
              error={formik.touched.hardness && Boolean(formik.errors.hardness)}
              helperText={formik.touched.hardness && formik.errors.hardness}
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
                  borderColor: "#D9D9D9",
                },
                "& .MuiSelect-select": {
                  padding: "6px 12px",
                },
              }}
            >
              {hardness?.data.map((item: HardnessType) => (
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
              variant="outlined"
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
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
                  borderColor: "#D9D9D9",
                },
              }}
            />
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
                    <TextField
                      fullWidth
                      type="number"
                      value={formik.values.predictingPoint || ""}
                      placeholder="Input Text"
                      onChange={(event) => {
                        const value =
                          Number(event.target.value);
                        formik.setFieldValue("predictingPoint", value);
                        setPredictingPoint(value);
                        handleInterpolationChange({
                          predictingPoint: value,
                        });
                      }}
                      variant="outlined"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "32px",
                          borderRadius: "6px",
                          px: "12px",
                          fontSize: "14px",
                        },
                        "& input::placeholder": {
                          color: "#D9D9D9",
                          opacity: 1,
                        },
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
                    <TextField
                      select
                      fullWidth
                      value={formik.values.upperLimitNorm || ""}
                      onChange={(event) =>
                        formik.setFieldValue(
                          "upperLimitNorm",
                          event.target.value
                        )
                      }
                      variant="outlined"
                      InputProps={{
                        startAdornment: formik.values.upperLimitNorm ? null : (
                          <InputAdornment
                            position="start"
                            sx={{ color: "#D9D9D9", ml: "12px" }}
                          >
                            Placeholder
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "32px",
                          borderRadius: "6px",
                          px: "12px",
                          fontSize: "14px",
                        },
                        "& .MuiInputBase-input": {
                          color: formik.values.upperLimitNorm
                            ? "inherit"
                            : "transparent",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: formik.values.upperLimitNorm
                            ? "inherit"
                            : "#D9D9D9",
                        },
                      }}
                    >
                      {(existingNorms || []).map((norm) => (
                        <MenuItem key={norm._id} value={norm._id}>
                          {norm.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Điểm cận trên */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Điểm cận trên
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formik.values.upperLimitPoint || ""}
                      placeholder="Input Text"
                      onChange={(event) => {
                        const value =
                          Number(event.target.value);
                        formik.setFieldValue("upperLimitPoint", value);
                        setUpperLimitPoint(value);
                        handleInterpolationChange({
                          upperLimitPoint: value,
                        });
                      }}
                      variant="outlined"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "32px",
                          borderRadius: "6px",
                          px: "12px",
                          fontSize: "14px",
                        },
                        "& input::placeholder": {
                          color: "#D9D9D9",
                          opacity: 1,
                        },
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
                    <TextField
                      select
                      fullWidth
                      value={formik.values.lowerLimitNorm || ""}
                      onChange={(event) => {
                        formik.setFieldValue(
                          "lowerLimitNorm",
                          event.target.value
                        );
                      }}
                      variant="outlined"
                      InputProps={{
                        startAdornment: formik.values.lowerLimitNorm ? null : (
                          <InputAdornment
                            position="start"
                            sx={{ color: "#D9D9D9", ml: "12px" }}
                          >
                            Placeholder
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "32px",
                          borderRadius: "6px",
                          px: "12px",
                          fontSize: "14px",
                        },
                        "& .MuiInputBase-input": {
                          color: formik.values.lowerLimitNorm
                            ? "inherit"
                            : "transparent",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: formik.values.lowerLimitNorm
                            ? "inherit"
                            : "#D9D9D9",
                        },
                      }}
                    >
                      {(existingNorms || []).map((norm) => (
                        <MenuItem key={norm._id} value={norm._id}>
                          {norm.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Điểm cận dưới */}
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                    >
                      Điểm cận dưới
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formik.values.lowerLimitPoint || ""}
                      placeholder="Input Text"
                      onChange={(event) => {
                        const value =
                          Number(event.target.value);
                        formik.setFieldValue("lowerLimitPoint", value);
                        setLowerLimitPoint(value);
                        handleInterpolationChange({
                          lowerLimitPoint: value,
                        });
                      }}
                      variant="outlined"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "32px",
                          borderRadius: "6px",
                          px: "12px",
                          fontSize: "14px",
                        },
                        "& input::placeholder": {
                          color: "#D9D9D9",
                          opacity: 1,
                        },
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

          {/* Mã giao khoán */}
          <Box display="flex" alignItems={"center"} justifyContent={"space-between"}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Mã giao khoán
            </Typography>
            <Button
              size="small"
              onClick={() => setIsImportModalOpen(true)}
              startIcon={<CloudUpload />}
              variant="outlined" // Sử dụng outlined hoặc text để tránh quá nổi bật
              sx={{
                textTransform: 'none',
                fontSize: '12px',
                padding: '4px 8px',
                minWidth: 'auto',
                borderColor: '#1976d2', // Màu primary của MUI
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: '#e3f2fd', // Light blue background on hover
                  borderColor: '#1976d2',
                }
              }}
            >
              Tải lên
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Autocomplete
              multiple
              options={assignmentcodes.data}
              getOptionLabel={(option: AssignmentCodeOutputType) =>
                `${option.code}`
              }
              value={selectedAssignmentCodes}
              onChange={(event, newValue) => {
                setSelectedAssignmentCodes(newValue);
                const updatedNorms = newValue.map((item) => {
                  const existing = formik.values.norms.find(
                    (n: any) => n.assignmentCode === item._id
                  );
                  return {
                    assignmentCode: item._id,
                    norm: existing?.norm || undefined,
                  };
                });
                formik.setFieldValue("norms", updatedNorms);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  error={
                    formik.touched.norms &&
                    Boolean(formik.errors.norms) &&
                    typeof formik.errors.norms === "string" // CHỈ BÁO LỖI NẾU LÀ CHUỖI
                  }
                  helperText={
                    formik.touched.norms &&
                      typeof formik.errors.norms === "string"
                      ? formik.errors.norms // TRUYỀN CHUỖI VÀO helperText
                      : undefined // Nếu là mảng lỗi, không truyền gì cả (tránh lỗi Type)
                  }
                  placeholder={
                    selectedAssignmentCodes.length === 0
                      ? "Chọn mã giao khoán"
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
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: "4px 12px",
                },
                "& .MuiAutocomplete-input": {
                  padding: "0 !important",
                  flexGrow: 1,
                  minWidth: "60px",
                },
                "& .MuiChip-root": {
                  height: "20px",
                  fontSize: "12px",
                  margin: "2px",
                  lineHeight: "20px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
              }}
            />
          </Box>

          {/* Danh sách định mức */}
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
                                formik.values.norms[index].assignmentCode
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
                            assignmentcodes.data.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id ===
                                formik.values.norms[index].assignmentCode
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
                          value={formik.values.norms[index]?.norm || ""}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `norms[${index}].norm`,
                              e.target.value
                            )
                          }
                          variant="outlined"
                          error={Boolean(
                            typeof formik.errors.norms?.[index] === "object" &&
                            (formik.errors.norms?.[index] as any)?.norm
                          )}
                          helperText={
                            typeof formik.errors.norms?.[index] === "object"
                              ? (formik.errors.norms?.[index] as any)?.norm
                              : ""
                          }
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: formik.values.norms[index]?.norm
                                ? "#F2F2F2"
                                : "#FFFFFF",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
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
