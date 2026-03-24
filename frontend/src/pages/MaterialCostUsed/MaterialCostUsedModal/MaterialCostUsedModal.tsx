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
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  FieldArray,
  FormikProvider,
  useFormik,
  FormikErrors,
  FormikTouched,
} from "formik";
import api from "../../../config/api.config";
import {
  MaterialCostUsedInputType,
  ProductionScopeOutputType,
  Materials,
  PhaseOutputType,
  PhaseType,
} from "../../../types";
import { CircleX } from "lucide-react";
import { CloudUpload } from "@mui/icons-material";
import dayjs from "dayjs";
import FieldMonthYear from "../../../ui/FieldMonth_Year";
import SimpleImportModal from "../../../components/ReadExcel/ReadExcelModal";
import { readExcelFile } from "../../../utils/readExcel";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";

export default function MaterialCostUsedModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void;
  selected: any | null;
}) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });
  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get("/phases").then((res) => res.data.data),
  });
  const { data: materialassignments = { data: [] } } = useQuery({
    queryKey: ["materialassignments"],
    queryFn: async () =>
      api.get("/materialassignments").then((res) => res.data.data),
  });

  // Initial values
  const formik = useFormik({
    initialValues: {
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : "",
      groupIndexes: null,
      month: selected?.month ? dayjs(selected?.month).format("YYYY-MM") : "",
      phases: (selected?.phases || selected?.productionScope?.phases || []).map(
        (p: any) => ({
          phase: p.phase?._id ? String(p.phase._id) : "",
          production: Number(p.production ?? 0), // CHANGED
          unit:
            p.phase?.unit ??
            (p.phase?.name?.toLowerCase()?.includes("khấu than")
              ? "tấn"
              : "mét"),
          assignmentNormCode: p?.assignmentNormCode,
          adjustmentNormCode: p?.adjustmentNormCode,
        }),
      ),
      selectedMaterials: (() => {
        // 1. Tạo Map tra cứu (để lấy thông tin đầy đủ của vật liệu)
        const materialLookup = new Map(
          (materialassignments.data || []).map((m: Materials) => [m._id, m]),
        );

        // 2. Duyệt qua các lựa chọn và ánh xạ thành mảng vật liệu, bao gồm cả trùng lặp
        return (selected?.materials || []).flatMap((group: any) => {
          return (group.materials || [])
            .map((i: any) => {
              const materialId = i.material?._id;
              return materialLookup.get(materialId);
            })
            .filter(Boolean); // Loại bỏ vật liệu không hợp lệ (không tìm thấy trong Map)
        });
      })(),
      materials:
        selected?.materials?.flatMap((group: any) =>
          group.materials.map((mat: any) => ({
            material: mat.material?._id ? String(mat.material._id) : "",
            quantity: mat.quantity,
          })),
        ) || [],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Đóng gói payload đảm bảo phases luôn có unit
      const payload: Partial<MaterialCostUsedInputType> = {
        _id: selected?._id,
        productionScope: values?.productionScope,
        month: dayjs(new Date(values.month)).format("YYYY-MM"),
        phases: (values.phases || []).map((p: any) => ({
          phase: p.phase ?? "",
          production: Number(p.production ?? 0),
          unit: String(p.unit ?? ""),
          assignmentNormCode: p.assignmentNormCode,
          adjustmentNormCode: p.adjustmentNormCode,
        })),
        materials: (values.materials || []).map((m: any) => ({
          material: m.material ?? "",
          quantity: Number(m.quantity ?? 0),
        })) as any,
      };
      handleSubmit(payload);
    },
  });

  const { data: initialplannedcost } = useQuery({
    queryKey: ["initialplannedcost", formik.values.productionScope, open],
    queryFn: async () => {
      const res = await api.get(
        `/initialplannedcosts/getOne/${formik.values.productionScope}`,
      );
      return res.data.data;
    },
    enabled: !!formik.values.productionScope,
  });
  useEffect(() => {
    if (initialplannedcost && selected) {
      const group = initialplannedcost?.group?.find(
        (i: any) => selected.month === i.month,
      );
      formik.setFieldValue("groupIndexes", group);
    }
  }, [initialplannedcost, selected]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  const getError = (index: number, field: keyof PhaseType): string => {
    const phasesErrors = formik.errors.phases as
      | FormikErrors<PhaseType>[]
      | undefined;
    const error = phasesErrors?.[index];

    const phasesTouched = formik.touched.phases as
      | FormikTouched<PhaseType>[]
      | undefined;

    const touched = phasesTouched?.[index];

    // 3. Kiểm tra và trả về lỗi
    if (touched?.[field] && error?.[field]) {
      return error[field] as string;
    }
    return "";
  };

  const updateGroupsFromSelectedIndexes = (selected: any) => {
    const mapped = (selected.phases || []).map((g: any, index: number) => {
      return {
        phase: g.phase?._id || "",
        production: 0,
        unit:
          g.unit ??
          (g.phase?.name.toLowerCase().includes("khấu than") ? "tấn" : "mét"),
        assignmentNormCode: g.assignmentNormCode?._id,
        adjustmentNormCode: g.adjustmentNormCode?._id,
      };
    });
    formik.setFieldValue(
      "month",
      selected.month ? dayjs(selected.month).format("YYYY-MM") : "",
    );
    formik.setFieldValue("phases", mapped);
  };

  const handleImportData = (excelData: { code: string; norm: number }[]) => {
    // 1. Chuẩn hóa dữ liệu từ Excel: Lọc các mã giao khoán (code) có tồn tại
    const validMaterial: any[] = [];
    const newSelected: any[] = [];

    excelData.forEach((item) => {
      const matchingmaterial = materialassignments.data.find(
        (ac: any) => ac.code === item.code,
      );

      if (matchingmaterial) {
        // Chỉ thêm nếu mã có tồn tại trong hệ thống
        validMaterial.push({
          material: matchingmaterial._id,
          quantity: item.norm,
        });
        newSelected.push(matchingmaterial);
      }
    });

    // 2. Cập nhật State và Formik
    formik.setFieldValue(`materials`, validMaterial);
    formik.setFieldValue(`selectedMaterials`, newSelected);

    // Đóng modal import sau khi hoàn tất
    setIsImportModalOpen(false);
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={
        selected
          ? "Chỉnh sửa chi phí vật tư thực hiện"
          : "Tạo mới chi phí vật tư thực hiện"
      }
      breadcrumbs={["Danh mục", "Thống kê vận hành", "Chi phí vật tư thực hiện"]}
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
        {/* Mã diện sản xuất */}
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
          Mã diện sản xuất
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <FieldAutoCompleted
            formik={formik}
            field="productionScope"
            title=""
            labelkey="code"
            data={productionscopes.data}
          />
        </Box>
        {initialplannedcost && (
          <Box>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Chọn thời gian
            </Typography>
            <Autocomplete
              fullWidth
              options={initialplannedcost?.group || []}
              getOptionLabel={(g: any) => `${dayjs(g.month).format("MM/YYYY")}`}
              value={formik.values.groupIndexes || null}
              onChange={(event, newValue) => {
                formik.setFieldValue("groupIndexes", newValue);
                updateGroupsFromSelectedIndexes(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn thời gian"
                  placeholder="Chọn..."
                  sx={{ background: "white" }}
                  size="small"
                />
              )}
            />
          </Box>
        )}
        {formik.values.groupIndexes && (
          <Box sx={{ mt: 1 }}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #d0d7de",
                background: "transparent",
                borderRadius: "8px",
                p: 2,
                mt: 2,
                position: "relative",
              }}
            >
              <FieldMonthYear formik={formik} fieldName="month" />

              {/* {visiable.some(i => i === indexParent) && */}
              <FieldArray name="phases">
                {() => (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      p: 2,
                    }}
                  >
                    {formik.values.phases.map((item: any, index: number) => {
                      const phase = phases.data.find(
                        (pg: PhaseOutputType) => pg._id === item.phase,
                      );

                      return (
                        <Paper
                          elevation={0}
                          sx={{
                            border: "1px solid #d0d7de",
                            background: "transparent",
                            borderRadius: "8px",
                            p: 2,
                            mt: 2,
                            position: "relative",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: "15px",
                              color: "#444",
                              position: "absolute",
                              top: -10,
                              paddingInline: 2,
                              zIndex: 999,
                              background: "#f5f5f5",
                            }}
                          >
                            Công đoạn {index + 1}
                          </Typography>
                          <Box
                            key={index}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "1fr 1fr 1fr 1fr",
                              },
                              gap: 1.5,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            {/* Mã công đoạn */}
                            <Box>
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

                            {/* Tên công đoạn */}
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

                            {/* Sản lượng */}
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
                              <TextFieldNumber
                                formik={formik}
                                field={`phases.${index}.production`}
                              />
                            </Box>

                            {/* Đơn vị tính */}
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
                                type="text" // CHANGED
                                name={`phases[${index}].unit`} // CHANGED
                                value={formik.values.phases[index]?.unit}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    `phases[${index}].unit`,
                                    e.target.value,
                                  )
                                }
                                placeholder="VD: mét, tấn ..."
                                variant="outlined"
                                error={Boolean(getError(index, "unit"))}
                                helperText={getError(index, "unit")}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: "32px",
                                    borderRadius: "6px",
                                    px: "12px",
                                    fontSize: "14px",
                                    background: "white",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#D9D9D9",
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </FieldArray>

              {/* Chọn vật tư */}
              <Box
                display="flex"
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Vật tư, tài sản
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
                  allowDuplicate={true} // Cho phép chọn 1 chip nhiều lần
                  options={materialassignments.data || []}
                  value={formik.values.selectedMaterials || []}
                  getOptionLabel={(option: Materials) => option.code || ""}
                  placeholder="Chọn vật tư..."
                  onChange={(newValue) => {
                    const updated = newValue.map((item, i) => {
                      // Tìm vật tư cũ dựa trên cả ID và Index để tránh lấy nhầm dữ liệu của chip trùng tên
                      const existing = (formik.values.materials || []).find(
                        (n: any, index: number) =>
                          n.material === item._id && i === index,
                      );

                      return {
                        material: item._id,
                        quantity: existing?.quantity ?? undefined,
                      };
                    });

                    formik.setFieldValue("materials", updated);
                    formik.setFieldValue("selectedMaterials", newValue);
                  }}
                  // Đồng bộ styling cũ của bạn
                  width="100%"
                />
              </Box>

              {/* Danh sách materials */}
              <FieldArray name="materials">
                {() => (
                  <Box
                    sx={{
                      mt: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      p: 2,
                    }}
                  >
                    {formik.values.materials?.map((m: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-end",
                        }}
                      >
                        <Grid container spacing={2}>
                          {/* Mã vật tư */}
                          <Grid item xs={12} sm={3}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 1,
                              }}
                            >
                              Mã vật tư
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={
                                materialassignments.data.find(
                                  (ac: Materials) =>
                                    ac._id ===
                                    formik.values.materials[index]?.material,
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

                          {/* Tên vật tư */}
                          <Grid item xs={12} sm={4}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 1,
                              }}
                            >
                              Tên vật tư, tài sản
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={
                                materialassignments.data.find(
                                  (ac: Materials) =>
                                    ac._id ===
                                    formik.values.materials[index]?.material,
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

                          {/* Số lượng */}
                          <Grid item xs={12} sm={3}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 1,
                              }}
                            >
                              Số lượng
                            </Typography>
                            <TextFieldNumber
                              formik={formik}
                              field={`materials.${index}.quantity`}
                            />
                          </Grid>
                          {/* Số lượng */}
                          <Grid item xs={12} sm={2}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: "14px",
                                mb: 1,
                              }}
                            >
                              Đơn vị tính
                            </Typography>
                            <TextField
                              fullWidth
                              disabled
                              size="small"
                              value={
                                materialassignments.data.find(
                                  (ac: Materials) =>
                                    ac._id ===
                                    formik.values.materials[index]?.material,
                                )?.uom?.name || ""
                              }
                              placeholder="Placeholder"
                              variant="outlined"
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: "32px",
                                  borderRadius: "6px",
                                  px: "12px",
                                  fontSize: "14px",
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#D9D9D9",
                                },
                              }}
                            />
                          </Grid>
                        </Grid>

                        {/* Nút X */}
                        <IconButton
                          onClick={() => {
                            // const materialToRemove = materialassignments.data.find(
                            //   (ac: Materials) =>
                            //     ac._id === formik.values.materials[index].material
                            // );
                            // if (materialToRemove) {
                            const updatedSelectedMaterials =
                              formik.values.selectedMaterials.filter(
                                (s: any, i: number) => i !== index,
                              );
                            formik.setFieldValue(
                              `selectedMaterials`,
                              updatedSelectedMaterials,
                            );
                            // }

                            const updatedMaterials =
                              formik.values.materials.filter(
                                (s: any, i: number) => i !== index,
                              );
                            formik.setFieldValue(`materials`, updatedMaterials);
                          }}
                          sx={{
                            width: "24px",
                            height: "24px",
                            ml: 1,
                            p: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "transparent",
                            "&:hover": {
                              backgroundColor: "transparent",
                              opacity: 0.7,
                            },
                          }}
                        >
                          <CircleX size={24} strokeWidth={1} color="#757575" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </FieldArray>
            </Paper>
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
      </FormikProvider>

      <SimpleImportModal
        open={isImportModalOpen}
        setOpen={setIsImportModalOpen}
        onImport={handleImportData}
        readExcelFile={readExcelFile}
        type="material"
      />
    </BaseModal>
  );
}
