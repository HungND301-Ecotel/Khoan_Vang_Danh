import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FormikProvider, useFormik } from "formik";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";

import { MaterialCostUsedInputType } from "../../../types";
import { readExcelFile } from "../../../utils/readExcel";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";
import { systemConfigsAtom } from "../../../atoms/systemConfigAtoms";
import { SYSTEM_KEYS } from "../../../utils/constant";
import FieldMonthYear from "../../../ui/FieldMonth_Year";

import { PreviewRow } from "./types";
import { useModalQueries } from "./useModalQueries";
import { useInitialValues } from "./useInitialValues";
import PhaseSection from "./PhaseSection";
import MaterialSection from "./MaterialSection";
import ImportPreviewDialog from "./ImportPreviewDialog";
import { validationSchema } from "./Validation";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const systemConfigs = useAtomValue(systemConfigsAtom);
  const cuttingPhaseGroupKey = useMemo(() => {
    return (
      systemConfigs.find((c) => c.key === SYSTEM_KEYS.KHAU_THAN)?.value || ""
    );
  }, [systemConfigs]);

  const formikForScope = useFormik({
    initialValues: { 
      department: selected?.department?._id ? String(selected.department._id) : "",
      productionScope: selected?.productionScope?._id ? String(selected.productionScope._id) : "" 
    },
    onSubmit: () => {},
  });
  
  const {
    availableScopes,
    productionscopes,
    phases,
    departments,
    assignmentcodes,
    materialassignments,
    refetchMaterialAssignments,
    initialplannedcost,
    createMutation,
  } = useModalQueries(formikForScope.values.department, formikForScope.values.productionScope, open);

  const initialValues = useInitialValues(selected, materialassignments.data, cuttingPhaseGroupKey);

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
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

  useEffect(() => {
    formikForScope.setFieldValue("department", formik.values.department);
    formikForScope.setFieldValue("productionScope", formik.values.productionScope);
  }, [formik.values.department, formik.values.productionScope]);

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

  const updateGroupsFromSelectedIndexes = (selectedGroup: any) => {
    const mapped = (selectedGroup.phases || []).map((g: any) => {
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
      selectedGroup.month ? dayjs(selectedGroup.month).format("YYYY-MM") : "",
    );
    formik.setFieldValue("phases", mapped);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawData = await readExcelFile(file);
      const dataRows = rawData.slice(1);

      const parsedData: PreviewRow[] = [];

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateMaterial = async (row: PreviewRow, index: number) => {
    try {
      const assignmentId =
        row.selectedAssignmentId && row.selectedAssignmentId !== "none"
          ? row.selectedAssignmentId
          : undefined;
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
        const { data: newMaterialsRes } = await refetchMaterialAssignments();
        const latestMaterials = newMaterialsRes?.data || [];

        const newData = [...previewData];
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

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

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
              disabled={!!selected?._id}
            />
          }
          label={<Typography sx={{ fontWeight: 500 }}>Công việc khác</Typography>}
        />

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
            onChange={() => {
              formik.setFieldValue("productionScope", "");
              formik.setFieldValue("groupIndexes", null);
              formik.setFieldValue("phases", []);
            }}
          />
        </Box>

        {!formik.values.isOtherTask && (
          <>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
              Mã diện sản xuất
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <FieldAutoCompleted
                formik={formik}
                field="productionScope"
                title=""
                labelkey="code"
                data={availableScopes}
                disabled={!formik.values.department}
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
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
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
                  error={Boolean(formik.touched.month && formik.errors.month)}
                  helperText={formik.touched.month ? formik.errors.month : ""}
                />
              )}
            />
          </Box>
        )}

        {formik.values.isOtherTask && (
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
              Thời gian
            </Typography>
            <FieldMonthYear formik={formik} fieldName="month" />
          </Box>
        )}

        {(formik.values.groupIndexes || formik.values.isOtherTask) && (
          <PhaseSection
            formik={formik}
            phasesData={phases.data}
            isOtherTask={formik.values.isOtherTask}
            cuttingPhaseGroupKey={cuttingPhaseGroupKey}
          />
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

        {(formik.values.groupIndexes || formik.values.isOtherTask) && (
          <MaterialSection
            formik={formik}
            materialassignmentsData={materialassignments.data}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleExportTemplate={handleExportTemplate}
          />
        )}
      </FormikProvider>

      <ImportPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        previewData={previewData}
        setPreviewData={setPreviewData}
        onSave={handleSavePreview}
        handleCreateMaterial={handleCreateMaterial}
      />
    </BaseModal>
  );
}
