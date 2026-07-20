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
import { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FormikProvider, useFormik } from "formik";
import dayjs from "dayjs";

import {
  BaseConfigModalProps,
  MaterialCostUsedInputType,
} from "../../../types";
import { readExcelFile } from "../../../utils/readExcel";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";
import FieldMonthYear from "../../../ui/FieldMonth_Year";

import { PreviewRow } from "./types";
import { useModalQueries } from "./useModalQueries";
import { useInitialValues } from "./useInitialValues";
import MaterialSection from "./MaterialSection";
import ImportPreviewDialog from "./ImportPreviewDialog";
import { validationSchema } from "./Validation";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldInput from "../../../components/TextField/FieldInput";

export default function MaterialCostUsedModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  minimizedData,
  onMinimize,
  clearMinimize,
}: BaseConfigModalProps<MaterialCostUsedInputType, any>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const formikForScope = useFormik({
    initialValues: {
      department: selected?.department?._id || minimizedData?.department || "",
      productionScope:
        selected?.productionScope?._id || minimizedData?.productionScope || "",
      month: selected?.month || minimizedData?.month || "",
    },
    onSubmit: () => {},
  });

  const {
    availableScopes,
    departments,
    assignmentcodes,
    materialassignments,
    refetchMaterialAssignments,
    initialplannedcostMonths,
    scopePhases,
    createMutation,
  } = useModalQueries(
    formikForScope.values.department,
    formikForScope.values.productionScope,
    formikForScope.values.month,
    open,
  );

  const initialValues = useInitialValues(
    selected,
    minimizedData,
    materialassignments.data,
  );

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const payload: any = {
        _id: values._id || undefined,
        isOtherTask: values.isOtherTask,
        department: values.department,
        productionScope: values.isOtherTask
          ? undefined
          : values.productionScope,
        month: dayjs(values.month, "YYYY-MM").isValid()
          ? values.month
          : dayjs(new Date(values.month)).format("YYYY-MM"),
        phase: values.isOtherTask ? undefined : values.phase,
        production: Number(values.production ?? 0),
        unit: values.unit,
        assignmentNormCode: values.assignmentNormCode,
        adjustmentNormCode: values.adjustmentNormCode,
        materials: (values.materials || []).map((m: any) => ({
          material: m.material ?? "",
          quantity: Number(m.quantity ?? 0),
        })),
      };
      handleSubmit([payload]);
    },
  });

  // Đồng bộ formikForScope với formik để trigger query đúng lúc
  useEffect(() => {
    formikForScope.setFieldValue("department", formik.values.department);
    formikForScope.setFieldValue(
      "productionScope",
      formik.values.productionScope,
    );
    formikForScope.setFieldValue("month", formik.values.month);
  }, [
    formik.values.department,
    formik.values.productionScope,
    formik.values.month,
  ]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize({
        ...formik.values,
        _id: selected?._id || minimizedData?._id,
      });
    }
    setOpen(false);
  };

  // Khi chọn 1 phase từ danh sách scopePhases, đổ production/unit/assignmentNormCode/adjustmentNormCode
  // (giá trị mặc định từ kế hoạch) vào formik
  const handleSelectPhase = (phaseDoc: any) => {
    formik.setFieldValue("phase", phaseDoc?.phase?._id || "");
    formik.setFieldValue("production", 0); // sản lượng thực tế nhập mới, không lấy từ kế hoạch
    formik.setFieldValue("unit", phaseDoc?.unit || "");
    formik.setFieldValue(
      "assignmentNormCode",
      phaseDoc?.assignmentNormCode?._id,
    );
    formik.setFieldValue(
      "adjustmentNormCode",
      phaseDoc?.adjustmentNormCode?._id,
    );
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
              ? {
                  _id: m.assignmentCode._id,
                  code: m.assignmentCode.code,
                  name: m.assignmentCode.name || m.assignmentCode.code,
                }
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    const currentSelectedMaterials = [
      ...(formik.values.selectedMaterials || []),
    ];

    validRows.forEach((r) => {
      const existingIndex = currentMaterials.findIndex(
        (m) => m.material === r.matchingmaterial._id,
      );
      if (existingIndex !== -1) {
        currentMaterials[existingIndex] = {
          ...currentMaterials[existingIndex],
          quantity:
            (Number(currentMaterials[existingIndex].quantity) || 0) +
            (Number(r.quantity) || 0),
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
      onMinimize={handleMinimize}
      title={
        formik.values._id
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
            {formik.values._id ? "Cập nhật" : "Xác nhận"}
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
                formik.setFieldValue("productionScope", "");
                formik.setFieldValue("phase", "");
                formik.setFieldValue("month", "");
                formik.setFieldValue("production", 0);
                formik.setFieldValue("unit", "");
                formik.setFieldValue("assignmentNormCode", undefined);
                formik.setFieldValue("adjustmentNormCode", undefined);
              }}
              disabled={!!formik.values._id}
            />
          }
          label={
            <Typography sx={{ fontWeight: 500 }}>Công việc khác</Typography>
          }
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
              formik.setFieldValue("phase", "");
              formik.setFieldValue("month", "");
            }}
          />
        </Box>

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
                data={availableScopes}
                disabled={!formik.values.department}
                onChange={() => {
                  formik.setFieldValue("phase", "");
                  formik.setFieldValue("month", "");
                }}
              />
            </Box>
          </>
        )}

        {!formik.values.isOtherTask && formik.values.productionScope && (
          <Box>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Chọn thời gian
            </Typography>
            <Autocomplete
              fullWidth
              options={initialplannedcostMonths.data || []}
              getOptionLabel={(g: any) =>
                dayjs(g.month, "YYYY-MM").format("MM/YYYY")
              }
              value={
                initialplannedcostMonths.data?.find(
                  (g: any) => g.month === formik.values.month,
                ) || null
              }
              onChange={(event, newValue) => {
                formik.setFieldValue("month", newValue?.month || "");
                formik.setFieldValue("phase", "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn thời gian"
                  placeholder="Chọn..."
                  sx={{ background: "white" }}
                  size="small"
                  error={Boolean(formik.touched.month && formik.errors.month)}
                  helperText={
                    formik.touched.month
                      ? String(formik.errors.month || "")
                      : ""
                  }
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

        {!formik.values.isOtherTask && formik.values.month && (
          <Box>
            <Typography
              sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}
            >
              Chọn công đoạn
            </Typography>
            <Autocomplete
              fullWidth
              options={scopePhases.data || []}
              getOptionLabel={(p: any) =>
                `${p.phase?.code || ""} - ${p.phase?.name || ""}`
              }
              value={
                scopePhases.data?.find(
                  (p: any) => p.phase?._id === formik.values.phase,
                ) || null
              }
              onChange={(event, newValue) => handleSelectPhase(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn công đoạn"
                  placeholder="Chọn..."
                  sx={{ background: "white" }}
                  size="small"
                  error={Boolean(formik.touched.phase && formik.errors.phase)}
                  helperText={
                    formik.touched.phase
                      ? String(formik.errors.phase || "")
                      : ""
                  }
                />
              )}
            />

            {formik.values.phase && (
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <TextFieldNumber
                  title="Sản lượng thực hiện"
                  formik={formik}
                  field="production"
                />
                <FieldInput
                  title="ĐVT"
                  formik={formik}
                  field="unit"
                  disabled
                />
              </Box>
            )}
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

        {(formik.values.phase || formik.values.isOtherTask) && (
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
