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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  ThicknessType,
  LengthType,
  BaseConfigModalProps,
} from "../../../types";
import { CloudUpload } from "@mui/icons-material";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";
const validationSchema = yup.object({
  curbSlope: yup.string().required("Độ dốc vỉa không được để trống"),
  thickness: yup.string().required("Độ dày vỉa không được để trống"),
  hardness: yup.string().required("Độ cứng không được để trống"),
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

export default function CuttingNormKBModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  hasExistingRecords,
  existingNorms,
  minimizedData,
  onMinimize,
  clearMinimize,
}: BaseConfigModalProps<AssignmentNormInputType, AssignmentNormOutputType> & {
  hasExistingRecords: boolean;
  existingNorms: AssignmentNormOutputType[];
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);
  const [showAdditionalRows, setShowAdditionalRows] = useState(false);
  // Maps lưu norms theo assignmentCode cho cận trên và cận dưới
  const [upperNormsMap, setUpperNormsMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [lowerNormsMap, setLowerNormsMap] = useState<Map<string, number>>(
    new Map(),
  );

  // Danh sách norms gốc (được tạo từ union của cả hai map)
  const [originalNorms, setOriginalNorms] = useState<any[]>([]);

  const { data: assignmentcodes = { data: [] } } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: hardness = { data: [] } } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });
  const { data: thickness = { data: [] } } = useQuery({
    queryKey: ["thickness"],
    queryFn: async () => api.get(`/thickness`).then((res) => res.data.data),
  });
  const { data: curbslopes = { data: [] } } = useQuery({
    queryKey: ["curbslopes"],
    queryFn: async () => api.get(`/curbslopes`).then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      hardness: minimizedData?.hardness || "",
      code: minimizedData?.code || selected?.code || "",
      curbSlope: minimizedData?.curbSlope || "",
      thickness: minimizedData?.thickness || "",
      type: "coal_kb",
      interpolationMethod: minimizedData?.interpolationMethod || "",
      predictingPoint: minimizedData?.predictingPoint || "",
      upperLimitNorm: minimizedData?.upperLimitNorm || "",
      upperLimitPoint: minimizedData?.upperLimitPoint || "",
      lowerLimitNorm: minimizedData?.lowerLimitNorm || "",
      lowerLimitPoint: minimizedData?.lowerLimitPoint || "",
      interpolatedNorm: minimizedData?.interpolatedNorm || "",
      norms: minimizedData?.norms || ([] as any[]),
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      console.log("fdsds");
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
          ?.filter((item: any) => item.assignmentCode && item.norm)
          .map((item: any) => ({
            assignmentCode: item.assignmentCode,
            norm: item?.norm,
          })),
      });
    },
  });

  useEffect(() => {
    if (minimizedData && open) {
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        minimizedData.norms?.some(
          (norm: any) =>
            (typeof norm.assignmentCode === "string"
              ? norm.assignmentCode
              : norm.assignmentCode?._id) === ac._id
        )
      );
      setSelectedAssignmentCodes(selectedCodes);
      if (minimizedData.upperLimitNorm || minimizedData.lowerLimitNorm) {
        setShowAdditionalRows(true);
      }
    } else if (selected && selected.norms.length > 0 && open) {
      formik.setValues({
        ...formik.values,
        hardness: selected?.hardness?._id || "",
        code: selected?.code || "",
        curbSlope: selected?.curbSlope?._id || "",
        thickness: selected?.thickness?._id || "",
        type: "coal_kb",
        norms:
          selected?.norms && selected.norms.length > 0
            ? selected.norms.map((item) => ({
                assignmentCode: item.assignmentCode?._id ?? "",
                norm: item.norm,
              }))
            : [],
      });
      const selectedCodes = assignmentcodes.data.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id),
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else if (open) {
      setSelectedAssignmentCodes([]);
    }
  }, [selected, minimizedData, assignmentcodes.data, open]);

  // Effect khi chọn cận trên
  useEffect(() => {
    if (formik.values.upperLimitNorm) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.upperLimitNorm,
      );
      if (selectedNorm?.norms) {
        // Tạo map từ assignmentCode._id -> norm
        const map = new Map(
          selectedNorm.norms
            .filter(
              (n): n is typeof n & { assignmentCode: { _id: string } } =>
                !!n.assignmentCode?._id && n.norm != null,
            )
            .map((n) => [n.assignmentCode!._id, n.norm!]),
        );
        setUpperNormsMap(map);

        // Lấy danh sách mã giao khoán từ định mức cận trên
        const upperNormCodes = selectedNorm.norms
          .filter((n) => n.assignmentCode?._id)
          .map((n) => n.assignmentCode);

        // Cập nhật selectedAssignmentCodes với mã từ cận trên
        setSelectedAssignmentCodes((prev) => {
          if (formik.values.lowerLimitNorm) {
            const lowerNorm = existingNorms.find(
              (norm) => norm._id === formik.values.lowerLimitNorm,
            );
            const lowerNormCodes =
              lowerNorm?.norms
                .filter((n) => n.assignmentCode?._id)
                .map((n) => n.assignmentCode) || [];
            const allCodes = [...upperNormCodes, ...lowerNormCodes];
            const uniqueCodes = allCodes.filter(
              (code, index, self) =>
                index === self.findIndex((c) => c._id === code._id),
            );
            return uniqueCodes;
          }
          return upperNormCodes;
        });

        updateNormsFromSelectedNorms();
      } else {
        setUpperNormsMap(new Map());
      }
    } else {
      setUpperNormsMap(new Map());
    }
  }, [formik.values.upperLimitNorm, existingNorms]);

  // Effect khi chọn cận dưới
  useEffect(() => {
    if (formik.values.lowerLimitNorm) {
      const selectedNorm = existingNorms.find(
        (norm) => norm._id === formik.values.lowerLimitNorm,
      );
      if (selectedNorm?.norms) {
        const map = new Map(
          selectedNorm.norms
            .filter(
              (n): n is typeof n & { assignmentCode: { _id: string } } =>
                !!n.assignmentCode?._id && n.norm != null,
            )
            .map((n) => [n.assignmentCode!._id, n.norm!]),
        );
        setLowerNormsMap(map);

        const lowerNormCodes = selectedNorm.norms
          .filter((n) => n.assignmentCode?._id)
          .map((n) => n.assignmentCode);

        setSelectedAssignmentCodes((prev) => {
          if (formik.values.upperLimitNorm) {
            const upperNorm = existingNorms.find(
              (norm) => norm._id === formik.values.upperLimitNorm,
            );
            const upperNormCodes =
              upperNorm?.norms
                .filter((n) => n.assignmentCode?._id)
                .map((n) => n.assignmentCode) || [];
            const allCodes = [...upperNormCodes, ...lowerNormCodes];
            const uniqueCodes = allCodes.filter(
              (code, index, self) =>
                index === self.findIndex((c) => c._id === code._id),
            );
            return uniqueCodes;
          }
          return lowerNormCodes;
        });

        updateNormsFromSelectedNorms();
      } else {
        setLowerNormsMap(new Map());
      }
    } else {
      setLowerNormsMap(new Map());
    }
  }, [formik.values.lowerLimitNorm, existingNorms]);

  // Hàm cập nhật originalNorms từ cả hai map
  const updateNormsFromSelectedNorms = () => {
    const allCodes = new Set([
      ...Array.from(upperNormsMap.keys()),
      ...Array.from(lowerNormsMap.keys()),
    ]);

    const normsArray = Array.from(allCodes).map((codeId) => {
      // Lấy norm từ cận dưới nếu có, nếu không thì từ cận trên
      const norm = lowerNormsMap.get(codeId) ?? upperNormsMap.get(codeId) ?? 0;
      return {
        assignmentCode: codeId,
        norm,
      };
    });

    setOriginalNorms(normsArray);
    formik.setFieldValue("norms", normsArray);
  };

  // Effect đồng bộ norms khi selectedAssignmentCodes thay đổi (chọn thủ công)
  useEffect(() => {
    if (selectedAssignmentCodes.length > 0) {
      const updatedNorms = selectedAssignmentCodes.map((code) => {
        const existingNorm = formik.values.norms.find(
          (n: any) => n.assignmentCode === code._id,
        );
        return {
          assignmentCode: code._id,
          norm: existingNorm?.norm || "",
        };
      });
      formik.setFieldValue("norms", updatedNorms);
    }
  }, [selectedAssignmentCodes]);

  // Hàm xử lý nội suy
  const handleInterpolationChange = () => {
    const x1 =
      formik.values.lowerLimitPoint !== ""
        ? Number(formik.values.lowerLimitPoint)
        : null;
    const x2 =
      formik.values.upperLimitPoint !== ""
        ? Number(formik.values.upperLimitPoint)
        : null;
    const x =
      formik.values.predictingPoint !== ""
        ? Number(formik.values.predictingPoint)
        : null;

    if (x1 == null || x2 == null || x == null || x2 === x1) {
      formik.setFieldValue("interpolatedNorm", "");
      return;
    }

    const interpolatedNorms = originalNorms.map((item) => {
      const codeId = item.assignmentCode;
      const y1 = lowerNormsMap.get(codeId); // norm cận dưới (có thể undefined)
      const y2 = upperNormsMap.get(codeId); // norm cận trên (có thể undefined)

      // Nếu một trong hai giá trị bị thiếu → đặt norm = 0
      if (y1 == null || y2 == null) {
        return { ...item, norm: 0 };
      }

      // Cả hai đều có → nội suy tuyến tính
      const y = y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
      return { ...item, norm: Number(y.toFixed(2)) };
    });

    formik.setFieldValue("norms", interpolatedNorms);

    // Cập nhật giá trị hiển thị (lấy norm đầu tiên)
    if (interpolatedNorms.length > 0) {
      formik.setFieldValue("interpolatedNorm", interpolatedNorms[0].norm);
    } else {
      formik.setFieldValue("interpolatedNorm", "");
    }
  };

  // Gọi lại interpolation khi các giá trị đầu vào thay đổi
  useEffect(() => {
    handleInterpolationChange();
  }, [
    formik.values.lowerLimitPoint,
    formik.values.upperLimitPoint,
    formik.values.predictingPoint,
    lowerNormsMap,
    upperNormsMap,
    originalNorms,
  ]);

  const handleClose = () => {
    formik.resetForm();
    setSelectedAssignmentCodes([]);
    setShowAdditionalRows(false);
    setUpperNormsMap(new Map());
    setLowerNormsMap(new Map());
    setOriginalNorms([]);
    setOpen(false);
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize({ ...formik.values, _id: selected?._id || minimizedData?._id });
  };

  const handleImportData = (excelData: { code: string; norm: number }[]) => {
    const validNorms: any[] = [];
    const newSelectedCodes: AssignmentCodeOutputType[] = [];

    excelData.forEach((item) => {
      const matchingAssignmentCode = assignmentcodes.data.find(
        (ac: AssignmentCodeOutputType) => ac.code === item.code,
      );

      if (matchingAssignmentCode) {
        validNorms.push({
          assignmentCode: matchingAssignmentCode._id,
          norm: item.norm,
        });
        newSelectedCodes.push(matchingAssignmentCode);
      }
    });

    setSelectedAssignmentCodes(newSelectedCodes);
    setOriginalNorms(validNorms); // cập nhật originalNorms
    formik.setFieldValue("norms", validNorms);
    setIsImportModalOpen(false);
  };
  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selected || minimizedData?._id) ? "Chỉnh sửa định mức khấu than KB"
          : "Tạo mới định mức khấu than KB"
      }
      breadcrumbs={["Danh mục","Khấu than","KB"]}
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
            {(selected || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
        <FormikProvider value={formik}>
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Độ dày vỉa
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={thickness.data}
              formik={formik}
              labelkey="name"
              field="thickness"
              title=""
            />
          </Box>
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Độ dốc vỉa
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldAutoCompleted
              data={curbslopes.data}
              formik={formik}
              labelkey="name"
              field="curbSlope"
              title=""
            />
          </Box>
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

          {/* Mã định mức */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã định mức
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FieldInput formik={formik} field="code" />
          </Box>
          {hasExistingRecords && (
            <Box sx={{ display: "flex",mt: 2 }}>
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
              />
            </Box>
          )}

          {showAdditionalRows && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Grid container spacing={2}>
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
                    />
                  </Grid>
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
                    />
                  </Grid>
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
                    />
                  </Grid>
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
              options={
                assignmentcodes.data?.filter(
                  (opt: AssignmentCodeOutputType) =>
                    !selectedAssignmentCodes.some((s) => s._id === opt._id),
                ) || []
              }
              value={selectedAssignmentCodes}
              getOptionLabel={(option) => option.code || ""}
              onChange={(newValue) => {
                setSelectedAssignmentCodes(newValue);
                const updatedNorms = newValue.map((item) => {
                  const existing = formik.values.norms.find(
                    (n: any) => n.assignmentCode === item._id,
                  );
                  return {
                    assignmentCode: item._id,
                    norm: existing?.norm || undefined,
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
                    <Grid container spacing={2}>
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
                            )?.code
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          disabled
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
                            )?.name
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          disabled
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
      
      <SimpleImportModal
        open={isImportModalOpen}
        setOpen={setIsImportModalOpen}
        onImport={handleImportData}
        readExcelFile={readExcelFile}
      />
    </BaseModal>
  );
}
