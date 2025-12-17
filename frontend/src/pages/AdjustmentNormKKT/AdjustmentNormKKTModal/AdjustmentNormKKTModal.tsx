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
  Autocomplete,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  AdjustmentNormInputType,
  AdjustmentNormOutputType,
  HardnessType,
  StepType,
  RockRatioType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import { CloudUpload } from "@mui/icons-material";

const validationSchema = yup.object({
  code: yup.string().required("Mã định mức không được để trống"),
  hardness: yup.string().required("Độ cứng của đá không được để trống"),
  rockRatio: yup.string().required("Tỉ lệ đá lẫn trong gương không được để trống"),
  norms: yup.array().of(
    yup.object().shape({
      assignmentCode: yup.string().required("Bắt buộc"),
      norm: yup.number().typeError("Phải là số").required("Bắt buộc"),
    })
  ).min(1, "Chọn mã giao khoán"),
})

export default function AdjustmentNormKKTModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AdjustmentNormInputType>) => void;
  selected: AdjustmentNormOutputType | null;
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);

  const { data: assignmentcodes = { totalDocs: 0, data: [] } } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: rockratios = { data: [] } } = useQuery({
    queryKey: ["rockratios"],
    queryFn: async () => api.get(`/rockratios`).then((res) => res.data.data),
  });
  const { data: hardness = { totalDocs: 0, data: [] } } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      hardness: selected?.hardness?._id || "",
      rockRatio: selected?.rockRatio?._id || "",
      code: selected?.code || "",
      type: "CKKT",
      norms:
        selected?.norms?.map((item) => ({
          assignmentCode: item.assignmentCode?._id || "",
          norm: item.norm,
        })) || [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit({
        ...values,
        hardness: values.hardness || undefined,
        type: values.type as "CM" | "CKKT" | "CKĐL",
      });
    },
  });

  useEffect(() => {
    // if (assignmentcodes.totalDocs === 0) return;

    if (selected && selected.norms.length > 0) {
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    }
  }, [selected, assignmentcodes.data]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

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
          maxWidth: "667px",
          height: "740px",
          p: "40px",
          position: "relative",
          borderRadius: '12px'
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "24px",
          height: "24px",
        }}
      >
        <CloseIcon sx={{ fontSize: "16px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mt: "8px" }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "12px", color: "#666" }}>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>Danh mục</Typography>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>Hệ số điều chỉnh định mức</Typography>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>Hệ số điều chỉnh định mức (CK.KT)</Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography sx={{ fontSize: "18px", color: "#1976d2", fontWeight: 500, mt: 1 }}>
          {selected
            ? "Chỉnh sửa Hệ số điều chỉnh định mức (CK.KT)"
            : "Tạo mới Hệ số điều chỉnh định mức (CK.KT)"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 2 }}>
        <FormikProvider value={formik}>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Mã định mức */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã định mức <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                id="code"
                name="code"
                placeholder="Input Text"
                value={formik.values.code}
                onChange={(event) => {
                  formik.setFieldValue("code", event.target.value);
                }}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiInputBase-root": {
                    height: "36px",
                    fontSize: "14px",
                  },
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Độ cứng của đá lẫn trong gương (f) <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                select
                id="hardness"
                name="hardness"
                placeholder="Placeholder"
                value={formik.values.hardness}
                onChange={(event) => {
                  formik.setFieldValue("hardness", event.target.value);
                }}
                variant="outlined"
                size="small"
                error={formik.touched.hardness && Boolean(formik.errors.hardness)}
                helperText={formik.touched.hardness && formik.errors.hardness}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "36px",
                    fontSize: "14px",
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

            {/* Tỷ lệ đá lẫn */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tỷ lệ đá lẫn trong gương (Ckẹp) <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                select
                id="rockRatio"
                name="rockRatio"
                placeholder="Placeholder"
                value={formik.values.rockRatio}
                onChange={(event) => {
                  formik.setFieldValue("rockRatio", event.target.value);
                }}
                variant="outlined"
                size="small"
                error={formik.touched.rockRatio && Boolean(formik.errors.rockRatio)}
                helperText={formik.touched.rockRatio && formik.errors.rockRatio}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "36px",
                    fontSize: "14px",
                  },
                }}
              >
                {rockratios.data?.map((step: RockRatioType) => (
                  <MenuItem key={step._id} value={step._id}>
                    {step.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
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
              <Autocomplete
                multiple
                options={assignmentcodes.data.filter(
                  (opt: AssignmentCodeOutputType) =>
                    !selectedAssignmentCodes.some(
                      (selected) => selected._id === opt._id
                    )
                )}
                getOptionLabel={(option: AssignmentCodeOutputType) =>
                  option.code || ""
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
                      norm: existing?.norm || "",
                    };
                  });
                  formik.setFieldValue("norms", updatedNorms);
                }}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={option._id}
                        label={option.code}
                        size="small"
                        {...chipProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Chọn..."
                    variant="outlined"
                    size="small"
                    error={
                      formik.touched.norms &&
                      Boolean(formik.errors.norms) &&
                      typeof formik.errors.norms === 'string' // CHỈ BÁO LỖI NẾU LÀ CHUỖI
                    }
                    helperText={
                      formik.touched.norms &&
                        typeof formik.errors.norms === 'string'
                        ? formik.errors.norms // TRUYỀN CHUỖI VÀO helperText
                        : undefined // Nếu là mảng lỗi, không truyền gì cả (tránh lỗi Type)
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: "36px",
                        fontSize: "14px",
                      },
                    }}
                  />
                )}
              />
            </Box>
            {formik.values.norms.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 40px",
                    gap: 2,
                    alignItems: "end",
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>
                    Mã giao khoán
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>
                    Tên vật tư, tài sản
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>
                    Định mức
                  </Typography>
                  <Box></Box>
                </Box>

                {formik.values.norms.map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 40px",
                      gap: 2,
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <TextField
                      fullWidth
                      value={
                        assignmentcodes.data.find(
                          (ac: AssignmentCodeOutputType) =>
                            ac._id === formik.values.norms[index].assignmentCode
                        )?.code || ""
                      }
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "36px",
                          fontSize: "14px",
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      value={
                        assignmentcodes.data.find(
                          (ac: AssignmentCodeOutputType) =>
                            ac._id === formik.values.norms[index].assignmentCode
                        )?.name || ""
                      }
                      placeholder="Placeholder"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "36px",
                          fontSize: "14px",
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      value={formik.values.norms[index]?.norm || ""}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `norms[${index}].norm`,
                          e.target.value
                        )
                      }
                      placeholder="Placeholder"
                      variant="outlined"
                      size="small"
                      error={Boolean(
                        typeof formik.errors.norms?.[index] === 'object' &&
                        (formik.errors.norms?.[index] as any)?.norm
                      )}
                      helperText={
                        typeof formik.errors.norms?.[index] === 'object'
                          ? (formik.errors.norms?.[index] as any)?.norm
                          : ''
                      }
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "36px",
                          fontSize: "14px",
                        },
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        const updatedCodes = selectedAssignmentCodes.filter(
                          (code) => code._id !== formik.values.norms[index].assignmentCode
                        );
                        setSelectedAssignmentCodes(updatedCodes);

                        const updatedNorms = formik.values.norms.filter(
                          (_, i) => i !== index
                        );
                        formik.setFieldValue("norms", updatedNorms);
                      }}
                      size="small"
                      sx={{
                        width: "32px",
                        height: "32px",
                        border: "1px solid #ddd",
                        borderRadius: "50%",
                        backgroundColor: "#f5f5f5",
                        "&:hover": {
                          backgroundColor: "#e0e0e0",
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: "16px", color: "#666" }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </FormikProvider>
      </DialogContent>

      <DialogActions sx={{ mt: 3, px: 0, gap: 1, justifyContent: "flex-end" }}>
        <Button
          onClick={handleClose}
          sx={{
            backgroundColor: "#f5f5f5",
            color: "#666",
            borderRadius: "4px",
            height: "36px",
            minWidth: "80px",
            fontSize: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e0e0e0",
            },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={() => formik.submitForm()}
          variant="contained"
          sx={{
            backgroundColor: "#1976d2",
            borderRadius: "4px",
            height: "36px",
            minWidth: "80px",
            fontSize: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
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