import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  MenuItem,
  DialogTitle,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  AdjustmentNormInputType,
  AdjustmentNormOutputType,
  StepType,
} from "../../../types";
import { Divider } from "antd";
import { useQuery } from "@tanstack/react-query";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import { CloudUpload } from "@mui/icons-material";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";

const validationSchema = yup.object({
  code: yup.string().required("Mã định mức không được để trống"),
  mirrorRatio: yup
    .string()
    .required("Tỉ lệ gương than mềm không được để trống"),
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

export default function AdjustmentNormCMModal({
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

  useEffect(() => {
    setSelectedAssignmentCodes([]);
  }, [open]);

  const { data: assignmentcodes = { totalDocs: 0, data: [] } } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: mirrorratios = { data: [] } } = useQuery({
    queryKey: ["mirrorratios"],
    queryFn: async () => api.get(`/mirrorratios`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      mirrorRatio: selected?.mirrorRatio?._id || "",
      code: selected?.code || "",
      type: "CM",
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
        type: values.type as "CM" | "CKKT" | "CKĐL",
      });
    },
  });

  useEffect(() => {
    if (selected && selected.norms.length > 0) {
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id),
      );
      setSelectedAssignmentCodes(selectedCodes);
    }
  }, [selected, assignmentcodes]);

  const handleClose = () => {
    formik.resetForm();
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
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "800px",
          maxWidth: "667px",
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
          top: "16px",
          right: "16px",
          width: "24px",
          height: "24px",
        }}
      >
        <CloseIcon sx={{ fontSize: "16px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mt: "8px" }}>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ fontSize: "12px", color: "#666" }}
        >
          <Typography sx={{ fontSize: "12px", color: "#666" }}>
            Danh mục
          </Typography>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>
            Hệ số điều chỉnh định mức
          </Typography>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>
            Hệ số điều chỉnh định mức (Cm)
          </Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography
          sx={{ fontSize: "18px", color: "#1976d2", fontWeight: 500, mt: 1 }}
        >
          {selected
            ? "Chỉnh sửa Hệ số điều chỉnh định mức (Cm)"
            : "Tạo mới Hệ số điều chỉnh định mức (Cm)"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 2 }}>
        <FormikProvider value={formik}>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
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
                variant="outlined"
                size="small"
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
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
                Tỷ lệ đá lẫn gương than mềm (Cm){" "}
                <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                select
                id="mirrorRatio"
                name="mirrorRatio"
                placeholder="Placeholder"
                value={formik.values.mirrorRatio}
                onChange={(event) => {
                  formik.setFieldValue("mirrorRatio", event.target.value);
                }}
                variant="outlined"
                size="small"
                error={
                  formik.touched.mirrorRatio &&
                  Boolean(formik.errors.mirrorRatio)
                }
                helperText={
                  formik.touched.mirrorRatio && formik.errors.mirrorRatio
                }
                sx={{
                  "& .MuiInputBase-root": {
                    height: "36px",
                    fontSize: "14px",
                  },
                }}
              >
                {mirrorratios.data.map((step: StepType) => (
                  <MenuItem key={step._id} value={step._id}>
                    {step.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
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
              <AppMultiAutocomplete
                options={
                  assignmentcodes.data?.filter(
                    (opt: AssignmentCodeOutputType) =>
                      !selectedAssignmentCodes.some(
                        (selected) => selected._id === opt._id,
                      ),
                  ) || []
                }
                value={selectedAssignmentCodes}
                getOptionLabel={(option: AssignmentCodeOutputType) =>
                  option.code || ""
                }
                placeholder="Chọn..."
                onChange={(newValue) => {
                  setSelectedAssignmentCodes(newValue);
                  const updatedNorms = newValue.map((item) => {
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
                error={
                  formik.touched.norms &&
                  typeof formik.errors.norms === "string"
                }
                helperText={
                  formik.touched.norms &&
                  typeof formik.errors.norms === "string"
                    ? formik.errors.norms
                    : undefined
                }
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
                    Tên mã giao khoán
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
                            ac._id ===
                            formik.values.norms[index].assignmentCode,
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
                            ac._id ===
                            formik.values.norms[index].assignmentCode,
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
                    <TextFieldNumber
                      formik={formik}
                      field={`norms.${index}.norm`}
                    />
                    <IconButton
                      onClick={() => {
                        const updatedCodes = selectedAssignmentCodes.filter(
                          (code) =>
                            code._id !==
                            formik.values.norms[index].assignmentCode,
                        );
                        setSelectedAssignmentCodes(updatedCodes);

                        const updatedNorms = formik.values.norms.filter(
                          (_, i) => i !== index,
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
