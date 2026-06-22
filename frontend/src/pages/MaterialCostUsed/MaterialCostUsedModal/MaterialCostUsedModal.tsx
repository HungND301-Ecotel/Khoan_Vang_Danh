import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  FieldArray,
  FormikProvider,
  useFormik,
  FormikErrors,
  FormikTouched,
} from "formik";
import api from "../../../config/api.config";
import {
  MaterialAssignmentInputType,
  MaterialCostUsedInputType,
  Materials,
  PhaseOutputType,
  PhaseType,
} from "../../../types";
import { CircleX } from "lucide-react";
import { CloudUpload, AddCircle } from "@mui/icons-material";
import dayjs from "dayjs";
import FieldMonthYear from "../../../ui/FieldMonth_Year";
import { readExcelFile } from "../../../utils/readExcel";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";
import { useAtomValue } from "jotai";
import { systemConfigsAtom } from "../../../atoms/systemConfigAtoms";
import { SYSTEM_KEYS } from "../../../utils/constant";

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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const systemConfigs = useAtomValue(systemConfigsAtom);
  const cuttingPhaseGroupKey = useMemo(() => {
    return (
      systemConfigs.find((c) => c.key === SYSTEM_KEYS.KHAU_THAN)?.value || ""
    );
  }, [systemConfigs]);

  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });
  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get("/phases").then((res) => res.data.data),
  });
  const { data: departments = { data: [] } } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => api.get("/departments").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
      api
        .post("/materialassignments", newMaterialAssignment)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["materialassignments"],
      });
    },
    onError: (error: any) => {
      console.log(error.response?.data?.message || error.response || "Lỗi");
    },
  });
  const {
    data: assignmentcodes = {
      totalDocs: 0,
      results: 0,
      data: [],
    },
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["assignmentcodes", "all"],
    queryFn: async () => {
      try {
        const response = await api.get(`/assignmentcodes`);
        return response.data.data;
      } catch (error) {
        return [];
      }
    },
  });
  const {
    data: materialassignments = { data: [] },
    refetch: refetchMaterialAssignments,
  } = useQuery({
    queryKey: ["materialassignments"],
    queryFn: async () =>
      api.get("/materialassignments").then((res) => res.data.data),
  });

  const initialValues = useMemo(() => ({
      isOtherTask: selected?.isOtherTask || false,
      department: selected?.department?._id
        ? String(selected.department._id)
        : "",
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
            (p.phase?.code
              ?.toLowerCase()
              ?.includes(cuttingPhaseGroupKey?.toLowerCase())
              ? "tấn"
              : "mét"),
          assignmentNormCode: p?.assignmentNormCode,
          adjustmentNormCode: p?.adjustmentNormCode,
        }),
      ),
      selectedMaterials: (() => {
        const materialLookup = new Map(
          (materialassignments.data || []).map((m: Materials) => [m._id, m]),
        );
        const uniqueMaterialIds = new Set();
        const result: any[] = [];
        (selected?.materials || []).forEach((group: any) => {
          (group.materials || []).forEach((i: any) => {
            const materialId = i.material?._id;
            if (materialId && materialLookup.has(materialId) && !uniqueMaterialIds.has(materialId)) {
              uniqueMaterialIds.add(materialId);
              result.push(materialLookup.get(materialId));
            }
          });
        });
        return result;
      })(),
      materials: (() => {
        const aggregatedMaterials = new Map();
        (selected?.materials || []).forEach((group: any) => {
          (group.materials || []).forEach((mat: any) => {
            const matId = mat.material?._id ? String(mat.material._id) : "";
            if (matId) {
              if (aggregatedMaterials.has(matId)) {
                aggregatedMaterials.set(matId, aggregatedMaterials.get(matId) + (Number(mat.quantity) || 0));
              } else {
                aggregatedMaterials.set(matId, Number(mat.quantity) || 0);
              }
            }
          });
        });
        return Array.from(aggregatedMaterials.entries()).map(([material, quantity]) => ({
          material,
          quantity,
        }));
      })(),
  }), [selected, materialassignments.data, cuttingPhaseGroupKey]);

  // Initial values
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Đóng gói payload đảm bảo phases luôn có unit
      const payload: Partial<MaterialCostUsedInputType> & { isOtherTask?: boolean } = {
        _id: selected?._id,
        isOtherTask: values.isOtherTask,
        department: values?.department,
        productionScope: values.isOtherTask ? undefined : values?.productionScope,
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
          (g.phase?.code
            .toLowerCase()
            .includes(cuttingPhaseGroupKey?.toLowerCase())
            ? "tấn"
            : "mét"),
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawData = await readExcelFile(file);
      // Giả định: Bỏ qua hàng đầu tiên (header)
      const dataRows = rawData.slice(1);

      const parsedData: any[] = [];

      dataRows.forEach((row, index) => {
        if (!row[0]) return;
        const code = String(row[0] || "").trim();
        const quantity = Number(row[1] || 0);

        let status = "valid";
        let message = "Hợp lệ";
        let matchingmaterial: any = null;
        let matchingassignment: any = null;

        const matchingMaterials = materialassignments.data.filter(
          (ac: any) => ac.code === code,
        );

        let availableAssignments: any[] = [];
        if (matchingMaterials.length > 0) {
          availableAssignments = matchingMaterials.map((m: any) =>
            m.assignmentCode
              ? { _id: m.assignmentCode._id, code: m.assignmentCode.code, name: m.assignmentCode.name || m.assignmentCode.code }
              : { _id: "none", code: "Không có", name: "Không có" },
          );
          availableAssignments = availableAssignments.filter(
            (v, i, a) => a.findIndex((t) => t._id === v._id) === i,
          );
        } else {
          availableAssignments = [
            { _id: "none", code: "Không có", name: "Không có" },
            ...(assignmentcodes?.data || []).map((ac: any) => ({
              _id: ac._id,
              code: ac.code,
              name: ac.name || ac.code,
            })),
          ];
        }

        if (matchingMaterials.length === 1) {
          matchingmaterial = matchingMaterials[0];
          matchingassignment = matchingmaterial.assignmentCode;
        } else if (matchingMaterials.length > 1) {
          status = "need_assignment";
          message = "Vui lòng chọn mã giao khoán";
        } else {
          status = "missing_material";
          message = "Cần tạo vật tư";
        }

        parsedData.push({
          id: index,
          code,
          materialName: matchingmaterial?.name || "",
          quantity,
          status,
          message,
          matchingmaterial,
          matchingassignment,
          matchingMaterials,
          availableAssignments,
          selectedAssignmentId:
            matchingMaterials.length === 1
              ? matchingassignment?._id || "none"
              : "",
        });
      });

      setPreviewData(parsedData);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Lỗi xử lý file Excel:", error);
    } finally {
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateMaterial = async (row: any, index: number) => {
    try {
      const assignmentId =
        row.selectedAssignmentId && row.selectedAssignmentId !== "none"
          ? row.selectedAssignmentId
          : null;
      const res: any = await createMutation.mutateAsync({
        code: row.code,
        name: row.materialName || row.code,
        quantity: row.quantity,
        assignmentCode: assignmentId,
      });

      const createdMaterial = res?.data || res;

      if (
        createdMaterial.status === "success" ||
        createdMaterial.message ||
        createdMaterial._id
      ) {
        // Lấy dữ liệu mới nhất từ server
        const { data: newMaterialsRes } = await refetchMaterialAssignments();
        const latestMaterials = newMaterialsRes?.data || [];

        const newData = [...previewData];
        // Cập nhật tất cả các dòng có cùng mã code và mã giao khoán
        newData.forEach((r) => {
          if (
            r.code === row.code &&
            r.selectedAssignmentId === row.selectedAssignmentId
          ) {
            r.status = "valid";
            r.message = "Đã tạo thành công";
            r.matchingmaterial = latestMaterials.find(
              (ac: any) =>
                ac.code === row.code &&
                (assignmentId
                  ? ac.assignmentCode?._id === assignmentId
                  : !ac.assignmentCode),
            );
            r.matchingassignment = r.matchingmaterial?.assignmentCode || null;
          }
        });
        setPreviewData(newData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSavePreview = () => {
    const validRows = previewData.filter(
      (r) => r.status === "valid" && r.matchingmaterial,
    );

    const currentMaterials = [...(formik.values.materials || [])];
    const currentSelectedMaterials = [...(formik.values.selectedMaterials || [])];

    validRows.forEach((r) => {
      const existingIndex = currentMaterials.findIndex(
        (m) => m.material === r.matchingmaterial._id
      );
      if (existingIndex !== -1) {
        currentMaterials[existingIndex] = {
          ...currentMaterials[existingIndex],
          quantity: (Number(currentMaterials[existingIndex].quantity) || 0) + (Number(r.quantity) || 0)
        };
      } else {
        currentMaterials.push({
          material: r.matchingmaterial._id,
          quantity: r.quantity,
        });
        currentSelectedMaterials.push(r.matchingmaterial);
      }
    });

    formik.setFieldValue(`materials`, currentMaterials);
    formik.setFieldValue(`selectedMaterials`, currentSelectedMaterials);

    setPreviewOpen(false);
  };

  const handleExportTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Mẫu");

      worksheet.columns = [
        { header: "Mã vật tư", key: "code", width: 30 },
        { header: "Số lượng", key: "value", width: 20 },
      ];

      // Format header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Xuất các vật tư đã được chọn trong form
      if (formik.values.materials && Array.isArray(formik.values.materials)) {
        formik.values.materials.forEach((m: any) => {
          const matDetail = materialassignments?.data?.find(
            (ac: any) => ac._id === m.material,
          );
          if (matDetail) {
            worksheet.addRow({
              code: matDetail.code || "",
              value: m.quantity || "",
            });
          }
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "Danh_sach_vat_tu.xlsx");
    } catch (error) {
      console.error("Lỗi khi tải mẫu:", error);
    }
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
      breadcrumbs={[
        "Danh mục",
        "Thống kê vận hành",
        "Chi phí vật tư thực hiện",
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
            {selected ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formik.values.isOtherTask}
              onChange={(e) => {
                formik.setFieldValue("isOtherTask", e.target.checked);
                if (e.target.checked) {
                  formik.setFieldValue("productionScope", "");
                  formik.setFieldValue("groupIndexes", null);
                  formik.setFieldValue("phases", [
                    { phase: "", production: 0, unit: "" },
                  ]);
                } else {
                  formik.setFieldValue("month", "");
                  formik.setFieldValue("phases", []);
                }
              }}
              disabled={!!selected?._id} // Không cho đổi loại khi sửa bản ghi đã tồn tại
            />
          }
          label={
            <Typography sx={{ fontWeight: 500 }}>Công việc khác</Typography>
          }
        />

        {/* Phân xưởng */}
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
          Phân xưởng
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <FieldAutoCompleted
            formik={formik}
            field="department"
            title=""
            labelkey="name"
            data={departments.data}
          />
        </Box>

        {/* Mã diện sản xuất */}
        {!formik.values.isOtherTask && (
          <>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Mã diện sản xuất
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%" }}
            >
              <FieldAutoCompleted
                formik={formik}
                field="productionScope"
                title=""
                labelkey="code"
                data={productionscopes.data}
                onChange={() => {
                  formik.setFieldValue("groupIndexes", null);
                  formik.setFieldValue("phases", []);
                }}
              />
            </Box>
          </>
        )}
        {initialplannedcost && !formik.values.isOtherTask && (
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

        {formik.values.isOtherTask && (
          <Box>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Thời gian
            </Typography>
            <FieldMonthYear formik={formik} fieldName="month" />
          </Box>
        )}
        {(formik.values.groupIndexes || formik.values.isOtherTask) && (
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
              {!formik.values.isOtherTask && (
                <FieldMonthYear
                  formik={formik}
                  fieldName="month"
                  disabled={true}
                />
              )}

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
                            <Box
                              sx={{
                                gridColumn: formik.values.isOtherTask
                                  ? "span 2"
                                  : "span 1",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  mb: 0.5,
                                }}
                              >
                                {formik.values.isOtherTask
                                  ? "Chọn công đoạn"
                                  : "Mã công đoạn"}
                              </Typography>
                              {formik.values.isOtherTask ? (
                                <Autocomplete
                                  size="small"
                                  options={phases.data}
                                  getOptionLabel={(option: any) =>
                                    `${option.code} - ${option.name}`
                                  }
                                  value={
                                    phases.data.find(
                                      (p: any) => p._id === item.phase,
                                    ) || null
                                  }
                                  onChange={(e, newValue) => {
                                    formik.setFieldValue(
                                      `phases[${index}].phase`,
                                      newValue?._id || "",
                                    );
                                    formik.setFieldValue(
                                      `phases[${index}].unit`,
                                      newValue?.unit || "mét",
                                    );
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder="Chọn công đoạn"
                                      sx={{ background: "white" }}
                                    />
                                  )}
                                />
                              ) : (
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
                              )}
                            </Box>

                            {/* Tên công đoạn */}
                            {!formik.values.isOtherTask && (
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
                            )}

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
                <Box display="flex" gap={1}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                  />
                  <Button
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
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
                  <Button
                    size="small"
                    onClick={handleExportTemplate}
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
                    Tải xuống
                  </Button>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <AppMultiAutocomplete
                  allowDuplicate={false}
                  options={materialassignments.data || []}
                  value={formik.values.selectedMaterials || []}
                  getOptionLabel={(option: Materials) =>
                    option.code +
                      " - " +
                      `${option.assignmentCode?.code || ""}` || ""
                  }
                  placeholder="Chọn vật tư..."
                  onChange={(newValue) => {
                    const updated = newValue.map((item) => {
                      const existing = (formik.values.materials || []).find(
                        (n: any) => n.material === item._id
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
                                )?.code +
                                  " - " +
                                  `${
                                    materialassignments.data.find(
                                      (ac: Materials) =>
                                        ac._id ===
                                        formik.values.materials[index]
                                          ?.material,
                                    )?.assignmentCode?.code || ""
                                  }` || ""
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

      {/* Import Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Xem trước kết quả tải lên</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã vật tư</TableCell>
                  <TableCell>Tên vật tư</TableCell>
                  <TableCell>Mã giao khoán</TableCell>
                  <TableCell>Tên giao khoán</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor:
                        row.status === "valid" ? "#e8f5e9" : "#ffebee",
                    }}
                  >
                    {/* Mã vật tư */}
                    <TableCell>{row.code}</TableCell>

                    {/* Tên vật tư - cho nhập nếu chưa có */}
                    <TableCell>
                      {row.status === "missing_material" ? (
                        <TextField
                          size="small"
                          placeholder="Nhập tên vật tư..."
                          value={row.materialName || ""}
                          onChange={(e) => {
                            const newData = [...previewData];
                            newData[index].materialName = e.target.value;
                            setPreviewData(newData);
                          }}
                          sx={{ minWidth: 160 }}
                        />
                      ) : (
                        row.matchingmaterial?.name ||
                        row.matchingMaterials?.[0]?.name ||
                        ""
                      )}
                    </TableCell>

                    {/* Mã giao khoán */}
                    <TableCell>
                      {row.matchingMaterials?.length > 1 ||
                      row.status === "missing_material" ||
                      row.status === "need_assignment" ? (
                        <Select
                          size="small"
                          value={row.selectedAssignmentId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newData = [...previewData];
                            newData[index].selectedAssignmentId = val;

                            // Cập nhật tên giao khoán theo mã được chọn
                            const selectedAc = newData[
                              index
                            ].availableAssignments?.find(
                              (a: any) => a._id === val,
                            );
                            newData[index].selectedAssignmentName =
                              selectedAc?.name || selectedAc?.code || "";

                            if (newData[index].matchingMaterials?.length > 1) {
                              const mat = newData[index].matchingMaterials.find(
                                (m: any) =>
                                  (m.assignmentCode?._id || "none") === val,
                              );
                              if (mat) {
                                newData[index].matchingmaterial = mat;
                                newData[index].matchingassignment =
                                  mat.assignmentCode;
                                newData[index].status = "valid";
                                newData[index].message = "Hợp lệ";
                              }
                            }
                            setPreviewData(newData);
                          }}
                          displayEmpty
                          sx={{ minWidth: 120, height: 32 }}
                        >
                          <MenuItem value="" disabled>
                            Chọn mã
                          </MenuItem>
                          {row.availableAssignments?.map((a: any) => (
                            <MenuItem key={a._id} value={a._id}>
                              {a.code}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        row.matchingassignment?.code || "Không có"
                      )}
                    </TableCell>

                    {/* Tên giao khoán */}
                    <TableCell>
                      {row.matchingMaterials?.length > 1 ||
                      row.status === "missing_material" ||
                      row.status === "need_assignment"
                        ? row.selectedAssignmentName || ""
                        : row.matchingassignment?.name ||
                          row.matchingassignment?.code ||
                          (row.matchingassignment === null ? "Không có" : "")}
                    </TableCell>

                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          row.status === "valid" ? "success.main" : "error.main"
                        }
                      >
                        {row.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.status === "missing_material" && (
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleCreateMaterial(row, index)}
                          title="Tạo vật tư"
                          disabled={!row.materialName?.trim()}
                        >
                          <AddCircle />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Hủy</Button>
          <Button
            onClick={handleSavePreview}
            variant="contained"
            color="primary"
            disabled={previewData.every((r) => r.status !== "valid")}
          >
            Lưu vào danh sách
          </Button>
        </DialogActions>
      </Dialog>
    </BaseModal>
  );
}
