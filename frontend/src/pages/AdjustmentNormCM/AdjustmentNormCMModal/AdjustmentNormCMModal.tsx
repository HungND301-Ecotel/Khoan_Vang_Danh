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
import { Field, FormikProvider, useFormik } from "formik";
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
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";

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
    <BaseModal
      open={open}
      onClose={handleClose}
      title={
        selectedAssignmentCodes
          ? "Chỉnh sủa hệ số điều chỉnh định mức CM"
          : "Tạo mới hệ số điều chỉnh định mức CM"
      }
      breadcrumbs={[
        "Danh mục",
        "Hệ số điều chỉnh định mức",
        "Hệ số điều chỉnh định mức CM",
      ]}
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
            {selectedAssignmentCodes ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
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
            <FieldInput formik={formik} field="code" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
              Tỷ lệ đá lẫn gương than mềm (Cm){" "}
              <span style={{ color: "red" }}>*</span>
            </Typography>
            <FieldAutoCompleted
              formik={formik}
              field="mirrorRatio"
              title=""
              labelkey="name"
              data={mirrorratios.data}
            />
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
                formik.touched.norms && typeof formik.errors.norms === "string"
              }
              helperText={
                formik.touched.norms && typeof formik.errors.norms === "string"
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
                          ac._id === formik.values.norms[index].assignmentCode,
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
                          ac._id === formik.values.norms[index].assignmentCode,
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
      <SimpleImportModal
        open={isImportModalOpen}
        setOpen={setIsImportModalOpen}
        onImport={handleImportData}
        readExcelFile={readExcelFile}
      />
    </BaseModal>
  );
}
