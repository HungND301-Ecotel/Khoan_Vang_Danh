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
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../../config/api.config";
import {
  AssignmentCodeOutputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  PhaseGroupType,
} from "../../../types";
import * as yup from "yup";
import { CloudUpload } from "@mui/icons-material";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";

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
      }),
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

  // Maps lưu norms theo assignmentCode cho cận trên và cận dưới
  const [upperNormsMap, setUpperNormsMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [lowerNormsMap, setLowerNormsMap] = useState<Map<string, number>>(
    new Map(),
  );

  // Danh sách norms gốc (được tạo từ union của cả hai map)
  const [originalNorms, setOriginalNorms] = useState<any[]>([]);

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
        (p: PhaseGroupType) => p.name?.toLowerCase() === "xén lò".toLowerCase(),
      )?._id,
    );
  }, [phasegroups]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: phaseGroup || "",
      phase: "",
      hardness: "",
      code: "",
      crossSection: "",
      type: "cutting",
      interpolationMethod: "",
      predictingPoint: "",
      upperLimitNorm: "",
      upperLimitPoint: "",
      lowerLimitNorm: "",
      lowerLimitPoint: "",
      interpolatedNorm: "",
      norms: [] as any[],
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
          ?.filter((item: any) => item.assignmentCode && item.norm)
          .map((item: any) => ({
            assignmentCode: item.assignmentCode,
            norm: item?.norm,
          })),
      });
    },
  });

  // Effect khi mở modal edit
  useEffect(() => {
    if (selected && selected.norms.length > 0 && open) {
      formik.setValues({
        ...formik.values,
        phase: selected?.phase?._id || "",
        hardness: selected?.hardness?._id || "",
        code: selected?.code || "",
        crossSection: selected?.crossSection?._id || "",
        type: "cutting",
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
    }
  }, [selected, assignmentcodes.data, open]);

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
          (n) => n.assignmentCode === code._id,
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
      title={
        selected
          ? "Chỉnh sửa định mức xén lò"
          : "Tạo mới định mức xén lò"
      }
      breadcrumbs={["Danh mục", "Thông số", "Định mức xén lò"]}
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
        {/* Nhóm công đoạn */}
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
            disabled={true}
            onChange={(newValue) => {
              setPhaseGroup(newValue._id);
              formik.setFieldValue("phase", "");
            }}
          />
        </Box>

        {/* Công đoạn */}
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

        {/* Tiết diện lò xén */}
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
          Tiết diện lò xén
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <FieldAutoCompleted
            data={crosssections.data}
            formik={formik}
            labelkey="name"
            field="crossSection"
            title=""
          />
        </Box>

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

        {/* Mã định mức */}
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
          Mã định mức
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <FieldInput formik={formik} field="code" />
        </Box>

        {/* Checkbox cho nội suy */}
        {hasExistingRecords && (
          <Box sx={{ display: "flex", mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showAdditionalRows}
                  onChange={(e) => setShowAdditionalRows(e.target.checked)}
                  sx={{
                    color: "#007BFF",
                    "&.Mui-checked": { color: "#007BFF" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "14px" }}>
                  Tạo định mức bằng phương pháp nội suy
                </Typography>
              }
            />
          </Box>
        )}

        {/* Các ô nhập nội suy */}
        {showAdditionalRows && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
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
                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
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
                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
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
                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
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
                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
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

        {/* Mã giao khoán */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
            Mã giao khoán
          </Typography>
          <Button
            size="small"
            onClick={() => setIsImportModalOpen(true)}
            startIcon={<CloudUpload />}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontSize: "12px",
              padding: "4px 8px",
              minWidth: "auto",
              borderColor: "#1976d2",
              color: "#1976d2",
              "&:hover": {
                backgroundColor: "#e3f2fd",
                borderColor: "#1976d2",
              },
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
            isOptionEqualToValue={(option, value) => option._id === value._id}
            onChange={(event, newValue) => {
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
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                error={
                  formik.touched.norms &&
                  Boolean(formik.errors.norms) &&
                  typeof formik.errors.norms === "string"
                }
                helperText={
                  formik.touched.norms &&
                  typeof formik.errors.norms === "string"
                    ? formik.errors.norms
                    : undefined
                }
                placeholder={
                  selectedAssignmentCodes.length === 0
                    ? "Chọn mã giao khoán"
                    : ""
                }
              />
            )}
            sx={{
              minWidth:"100%",
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
                          )?.code || ""
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
                          )?.name || ""
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
