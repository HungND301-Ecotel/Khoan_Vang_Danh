import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  FieldArray,
  FormikProvider,
  useFormik,
  FormikErrors,
  FormikTouched,
} from "formik";
import api from "../../../config/api.config";
import {
  ProductionScopeOutputType,
  PhaseOutputType,
  PhaseType,
  InitialPlannedCostInputType,
} from "../../../types";
import * as yup from "yup";
import FieldMonthYear from "../../../ui/FieldMonth_Year";
import dayjs from "dayjs";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import BaseModal from "../../../components/Common/BaseModal";
import FieldInput from "../../../components/TextField/FieldInput";

const validationSchema = yup.object({
  productionScope: yup.string().required("Diện sản xuất không được để trống"),
  groups: yup
    .array()
    .of(
      yup.object().shape({
        month: yup.date().required("Bắt buộc"),
        phases: yup
          .array()
          .of(
            yup.object().shape({
              production: yup
                .number()
                .min(1, "Sản lượng phải lớn hơn 0")
                .required("Bắt buộc"),
              unit: yup.string().required("Bắt buộc"),
            }),
          )
          .min(1, "Cần ít nhất một công đoạn"),
      }),
    )
    .min(1, "Cần ít nhất một tháng"),
});

export default function InitialPlannedCostModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: any) => void;
  selected: any | null;
}) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);

  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });
  const { data: phases = { data: [] } } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => api.get("/phases").then((res) => res.data.data),
  });

  const { data: assignmentnorms = { data: [] } } = useQuery({
    queryKey: ["assignmentnorms"],
    queryFn: async () =>
      api.get("/assignmentnorms").then((res) => res.data.data),
  });

  const { data: adjustmentnorms = { data: [] } } = useQuery({
    queryKey: ["adjustmentnorms"],
    queryFn: async () =>
      api.get("/adjustmentnorms").then((res) => res.data.data),
  });

  const toggleExpand = (index: number) => {
    setExpandedGroups((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const formik = useFormik({
    initialValues: {
      _id: selected?._id || "",
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : "",
      groups: selected?._id
        ? [
            {
              month: dayjs(selected?.month || new Date()).format("YYYY-MM"),
              phases: (selected?.phases || []).map((p: any) => ({
                phase: p.phase?._id ? String(p.phase._id) : "",
                production: Number(p.production ?? 0),
                unit:
                  p.unit ||
                  (p.phase?.name?.toLowerCase()?.includes("khấu than")
                    ? "tấn"
                    : "mét"),
                assignmentNormCode:
                  p.assignmentNormCode?._id ||
                  p.assignmentNormCode ||
                  undefined,
                adjustmentNormCode:
                  p.adjustmentNormCode?._id ||
                  p.adjustmentNormCode ||
                  undefined,
                assignmentCodes: p.assignmentNormCode?.norms
                  ? p.assignmentNormCode.norms.map((n: any) => {
                      const detail = p.initialPlannedCostDetails?.find(
                        (d: any) =>
                          (d.assignmentCode?._id || d.assignmentCode) ===
                          (n.assignmentCode?._id || n.assignmentCode),
                      );
                      const isChecked = detail ? true : false;

                      // Tìm hệ số điều chỉnh tương ứng từ adjustmentNormCode
                      const adjNorm = p.adjustmentNormCode?.norms?.find(
                        (an: any) =>
                          (an.assignmentCode?._id || an.assignmentCode) ===
                          (n.assignmentCode?._id || n.assignmentCode),
                      );

                      return {
                        assignmentCode:
                          n.assignmentCode?._id || n.assignmentCode,
                        code: n.assignmentCode?.code || "",
                        name: n.assignmentCode?.name || "",
                        baseNorm: detail?.baseNorm ?? n.norm ?? 0,
                        adjustmentNorm:
                          detail?.adjustmentNorm ?? adjNorm?.norm ?? 1,
                        norm: detail?.norm ?? (n.norm || 0) * (adjNorm?.norm || 1),
                        checked: isChecked,
                      };
                    })
                  : [],
              })),
            },
          ]
        : [
            {
              month: dayjs(new Date()).format("YYYY-MM"),
              phases: selected?.productionScope?.phases
                ? selected.productionScope.phases.map((ph: any) => ({
                    phase: ph.phase?._id ?? ph._id ?? "",
                    production: 0,
                    unit: (ph.phase?.phaseGroup?.name || ph.name || "")
                      ?.toLowerCase()
                      ?.includes("khấu than")
                      ? "tấn"
                      : "mét",
                    assignmentNormCode: undefined,
                    adjustmentNormCode: undefined,
                    assignmentCodes: [],
                  }))
                : [],
            },
          ],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        productionScope: values.productionScope,
        groups: values.groups.map((g: any) => ({
          month: dayjs(new Date(g.month)).format("YYYY-MM"),
          phases: g.phases.map((p: any) => ({
            phase: p.phase,
            production: Number(p.production),
            unit: String(p.unit),
            assignmentNormCode: p.assignmentNormCode,
            adjustmentNormCode: p.adjustmentNormCode,
              assignmentCodes: (p.assignmentCodes || [])
                .filter((ac: any) => ac.checked)
                .map((ac: any) => ({
                  assignmentCode: ac.assignmentCode,
                  baseNorm: Number(ac.baseNorm || 0),
                  adjustmentNorm: Number(ac.adjustmentNorm || 1),
                  norm: Number(ac.norm || 0),
                })),
          })),
        })),
      };

      if (selected) {
        // Nếu là edit thì vẫn gửi payload cũ cho tương thích với API edit 1 bản ghi
        handleSubmit({
          ...payload.groups[0],
          _id: values._id,
          productionScope: values.productionScope,
        });
      } else {
        handleSubmit(payload);
      }
    },
  });

  // Tự động điền phases khi productionScope đã được chọn (trường hợp Thêm cho diện có sẵn hoặc chọn từ dropdown)
  useEffect(() => {
    if (formik.values.productionScope && !selected?._id) {
      const scope = productionscopes.data.find(
        (ps: any) => ps._id === formik.values.productionScope,
      );
      if (scope && Array.isArray(scope.phases)) {
        const currentPhases = formik.values.groups[0]?.phases || [];
        if (currentPhases.length === 0) {
          const mappedPhases = scope.phases.map((ph: any) => ({
            phase: ph.phase?._id ?? ph._id ?? "",
            production: 0,
            unit: (ph.phase?.phaseGroup?.name || ph.name || "")
              ?.toLowerCase()
              ?.includes("khấu than")
              ? "tấn"
              : "mét",
            assignmentNormCode: undefined,
            adjustmentNormCode: undefined,
            assignmentCodes: [],
          }));
          formik.setFieldValue(
            "groups",
            formik.values.groups.map((g) => ({ ...g, phases: mappedPhases })),
          );
        }
      }
    }
  }, [formik.values.productionScope, productionscopes.data, selected?._id]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    setExpandedGroups([0]);
  };

  const getError = (
    groupIndex: number,
    phaseIndex: number,
    field: string,
  ): string => {
    const groupErrors = formik.errors.groups as any;
    const error = groupErrors?.[groupIndex]?.phases?.[phaseIndex]?.[field];
    const groupTouched = formik.touched.groups as any;
    const touched = groupTouched?.[groupIndex]?.phases?.[phaseIndex]?.[field];

    if (touched && error) return error;
    return "";
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={
        selected?._id
          ? "Chỉnh sửa chi phí kế hoạch ban đầu"
          : "Tạo mới chi phí kế hoạch ban đầu"
      }
      breadcrumbs={[
        "Danh mục",
        "Thống kê vận hành",
        "Chi phí kế hoạch ban đầu",
      ]}
      showZoom={true}
      titleExtra={
        !selected?._id &&
        formik.values.productionScope && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => {
              const lastGroup =
                formik.values.groups[formik.values.groups.length - 1];
              const newGroup = {
                month: dayjs(lastGroup.month).add(1, "month").format("YYYY-MM"),
                phases: [...lastGroup.phases],
              };
              formik.setFieldValue("groups", [
                ...formik.values.groups,
                newGroup,
              ]);
              setExpandedGroups((prev) => [
                ...prev,
                formik.values.groups.length,
              ]);
            }}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            Thêm tháng
          </Button>
        )
      }
      actions={
        <>
          <Button
            onClick={handleClose}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => formik.submitForm()}
            variant="contained"
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            {selected?._id ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
          Mã diện sản xuất
        </Typography>
        <TextField
          select
          fullWidth
          value={formik.values.productionScope || ""}
          onChange={(event) => {
            const scopeId = event.target.value;
            formik.setFieldValue("productionScope", scopeId);
            const scope = productionscopes.data.find(
              (ps: any) => ps._id === scopeId,
            );
            if (scope && Array.isArray(scope.phases)) {
              const mappedPhases = scope.phases.map((ph: any) => ({
                phase: ph.phase?._id ?? "",
                production: 0,
                unit: ph.phase?.phaseGroup?.name
                  ?.toLowerCase()
                  ?.includes("khấu than")
                  ? "tấn"
                  : "mét",
                assignmentNormCode: undefined,
                adjustmentNormCode: undefined,
                assignmentCodes: [],
              }));
              // Cập nhật phases cho tất cả các groups hiện tại
              formik.values.groups.forEach((_, idx) => {
                formik.setFieldValue(`groups.${idx}.phases`, mappedPhases);
              });
            }
          }}
          variant="outlined"
          error={
            formik.touched.productionScope &&
            Boolean(formik.errors.productionScope)
          }
          helperText={
            formik.touched.productionScope && formik.errors.productionScope
          }
          sx={{ "& .MuiInputBase-root": { height: "32px", fontSize: "14px" } }}
        >
          {productionscopes?.data.map((item: any) => (
            <MenuItem key={item._id} value={item._id}>
              {item.code}
            </MenuItem>
          ))}
        </TextField>

        {formik.values.productionScope && (
          <FieldArray name="groups">
            {({ remove }) => (
              <Box sx={{ mt: 2 }}>
                {formik.values.groups.map((group, gIdx) => (
                  <Paper
                    key={gIdx}
                    elevation={0}
                    sx={{
                      border: "1px solid #d0d7de",
                      borderRadius: "8px",
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flex: 1,
                        }}
                      >
                        <FieldMonthYear
                          formik={formik}
                          fieldName={`groups.${gIdx}.month`}
                        />
                        <IconButton
                          onClick={() => toggleExpand(gIdx)}
                          size="small"
                          sx={{ color: "#007BFF" }}
                        >
                          {expandedGroups.includes(gIdx) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Box>
                      {!selected?._id && formik.values.groups.length > 1 && (
                        <IconButton
                          onClick={() => remove(gIdx)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {expandedGroups.includes(gIdx) && (
                      <FieldArray name={`groups.${gIdx}.phases`}>
                        {() => (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                              mt: 2,
                            }}
                          >
                            {group.phases.map((item: any, pIdx: number) => {
                              const phase = phases.data.find(
                                (p: any) => p._id === item.phase,
                              );
                              return (
                                <Paper
                                  key={pIdx}
                                  elevation={0}
                                  sx={{
                                    border: "1px dashed #d0d7de",
                                    p: 2,
                                    position: "relative",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      position: "absolute",
                                      top: -10,
                                      px: 1,
                                      backgroundColor: "#fff",
                                    }}
                                  >
                                    Công đoạn {pIdx + 1}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "1fr 1fr",
                                        md: "1fr 1fr 1fr 1fr",
                                      },
                                      gap: 1.5,
                                      mt: 1,
                                    }}
                                  >
                                    <Box>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        Mã công đoạn
                                      </Typography>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={phase?.code || ""}
                                        disabled
                                        sx={{
                                          "& .MuiInputBase-root": {
                                            height: "30px",
                                            fontSize: "13px",
                                          },
                                        }}
                                      />
                                    </Box>
                                    <Box>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        Tên công đoạn
                                      </Typography>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={phase?.name || ""}
                                        disabled
                                        sx={{
                                          "& .MuiInputBase-root": {
                                            height: "30px",
                                            fontSize: "13px",
                                          },
                                        }}
                                      />
                                    </Box>
                                    <Box>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        Sản lượng
                                      </Typography>
                                      <TextFieldNumber
                                        formik={formik}
                                        field={`groups.${gIdx}.phases.${pIdx}.production`}
                                      />
                                    </Box>
                                    <Box>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        ĐVT
                                      </Typography>
                                      <TextField
                                        select
                                        fullWidth
                                        value={
                                          formik.values.groups[gIdx].phases[
                                            pIdx
                                          ].unit || ""
                                        }
                                        onChange={(e) =>
                                          formik.setFieldValue(
                                            `groups.${gIdx}.phases.${pIdx}.unit`,
                                            e.target.value,
                                          )
                                        }
                                        error={Boolean(
                                          getError(gIdx, pIdx, "unit"),
                                        )}
                                        sx={{
                                          "& .MuiInputBase-root": {
                                            height: "30px",
                                            fontSize: "13px",
                                          },
                                        }}
                                      >
                                        <MenuItem value="tấn">Tấn</MenuItem>
                                        <MenuItem value="mét">Mét</MenuItem>
                                      </TextField>
                                    </Box>
                                    <Box sx={{ gridColumn: "1 / -1" }}>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        Hệ số điều chỉnh
                                      </Typography>
                                      <FieldAutoCompleted
                                        formik={formik}
                                        field={`groups.${gIdx}.phases.${pIdx}.adjustmentNormCode`}
                                        title=""
                                        labelkey="code"
                                        data={adjustmentnorms.data}
                                        onChange={(newValue: any) => {
                                          const currentAssignmentCodes =
                                            formik.values.groups[gIdx].phases[
                                              pIdx
                                            ].assignmentCodes || [];

                                          const updatedCodes =
                                            currentAssignmentCodes.map(
                                              (ac: any) => {
                                                const adjNorm =
                                                  newValue?.norms?.find(
                                                    (n: any) =>
                                                      (n.assignmentCode?._id ||
                                                        n.assignmentCode) ===
                                                      ac.assignmentCode,
                                                  );
                                                const newAdjFactor =
                                                  adjNorm?.norm ?? 1;
                                                return {
                                                  ...ac,
                                                  adjustmentNorm: newAdjFactor,
                                                  norm:
                                                    (ac.baseNorm || 0) *
                                                    newAdjFactor,
                                                };
                                              },
                                            );

                                          formik.setFieldValue(
                                            `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                                            updatedCodes,
                                          );
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ gridColumn: "1 / -1" }}>
                                      <Typography
                                        sx={{ fontSize: "12px", mb: 0.5 }}
                                      >
                                        Định mức giao khoán
                                      </Typography>
                                      <FieldAutoCompleted
                                        formik={formik}
                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentNormCode`}
                                        title=""
                                        labelkey="code"
                                        data={assignmentnorms.data}
                                        onChange={(newValue: any) => {
                                          if (newValue && newValue.norms) {
                                            const adjustmentNormCode =
                                              formik.values.groups[gIdx].phases[
                                                pIdx
                                              ].adjustmentNormCode;
                                            const adjustmentDoc =
                                              adjustmentnorms.data.find(
                                                (a: any) =>
                                                  a._id === adjustmentNormCode,
                                              );

                                            const codes = newValue.norms.map(
                                              (n: any) => {
                                                const adjNorm =
                                                  adjustmentDoc?.norms?.find(
                                                    (an: any) =>
                                                      (an.assignmentCode?._id ||
                                                        an.assignmentCode) ===
                                                      (n.assignmentCode?._id ||
                                                        n.assignmentCode),
                                                  );
                                                const adjFactor =
                                                  adjNorm?.norm ?? 1;
                                                return {
                                                  assignmentCode:
                                                    n.assignmentCode?._id ||
                                                    n.assignmentCode,
                                                  code:
                                                    n.assignmentCode?.code ||
                                                    "",
                                                  name:
                                                    n.assignmentCode?.name ||
                                                    "",
                                                  baseNorm: n.norm || 0,
                                                  adjustmentNorm: adjFactor,
                                                  norm: (n.norm || 0) * adjFactor,
                                                  checked: true,
                                                };
                                              },
                                            );
                                            formik.setFieldValue(
                                              `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                                              codes,
                                            );
                                          } else {
                                            formik.setFieldValue(
                                              `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                                              [],
                                            );
                                          }
                                        }}
                                      />
                                    </Box>
                                    {formik.values.groups[gIdx].phases[pIdx]
                                      .assignmentNormCode && (
                                      <Box sx={{ gridColumn: "1 / -1", p: 1 }}>
                                        <Typography
                                          sx={{ fontSize: "12px", mb: 0.5 }}
                                        >
                                          Mã giao khoán
                                        </Typography>
                                        <AppMultiAutocomplete
                                          options={(
                                            formik.values.groups[gIdx].phases[
                                              pIdx
                                            ].assignmentCodes || []
                                          )
                                            .filter((ac: any) => !ac.checked)
                                            .map((ac: any) => ({
                                              _id: ac.assignmentCode,
                                              code: ac.code,
                                              name: ac.name || "",
                                              norm: ac.norm,
                                            }))}
                                          value={(
                                            formik.values.groups[gIdx].phases[
                                              pIdx
                                            ].assignmentCodes || []
                                          )
                                            .filter((ac: any) => ac.checked)
                                            .map((ac: any) => ({
                                              _id: ac.assignmentCode,
                                              code: ac.code,
                                              name: ac.name || "",
                                              norm: ac.norm,
                                            }))}
                                          getOptionLabel={(option: any) =>
                                            option.code || ""
                                          }
                                          onChange={(newValue: any[]) => {
                                            const newCheckedIds = newValue.map(
                                              (v) => v._id,
                                            );
                                            const updatedCodes = (
                                              formik.values.groups[gIdx].phases[
                                                pIdx
                                              ].assignmentCodes || []
                                            ).map((ac: any) => ({
                                              ...ac,
                                              checked: newCheckedIds.includes(
                                                ac.assignmentCode,
                                              ),
                                            }));
                                            formik.setFieldValue(
                                              `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                                              updatedCodes,
                                            );
                                          }}
                                        />

                                        {formik.values.groups[gIdx].phases[
                                          pIdx
                                        ].assignmentCodes?.filter(
                                          (ac: any) => ac.checked,
                                        ).length > 0 && (
                                          <Box
                                            sx={{
                                              mt: 2,
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: 1,
                                            }}
                                          >
                                            {formik.values.groups[gIdx].phases[
                                              pIdx
                                            ].assignmentCodes.map(
                                              (ac: any, cIdx: number) => {
                                                if (!ac.checked) return null;
                                                return (
                                                  <Box
                                                    key={
                                                      ac.assignmentCode || cIdx
                                                    }
                                                    sx={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 2,
                                                      p: 1,
                                                      borderRadius: 1,
                                                      border:
                                                        "1px solid #E0E0E0",
                                                    }}
                                                  >
                                                    <Box sx={{ width: "15%" }}>
                                                      <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Mã GK</Typography>
                                                      <FieldInput
                                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.code`}
                                                        formik={formik}
                                                        disabled
                                                      />
                                                    </Box>
                                                    <Box sx={{ width: "25%" }}>
                                                      <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Tên GK</Typography>
                                                      <FieldInput
                                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.name`}
                                                        formik={formik}
                                                        disabled
                                                      />
                                                    </Box>
                                                    <Box sx={{ width: "15%" }}>
                                                      <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>ĐM gốc</Typography>
                                                      <TextFieldNumber
                                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.baseNorm`}
                                                        formik={formik}
                                                        disabled
                                                      />
                                                    </Box>
                                                    <Box sx={{ width: "15%" }}>
                                                      <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Hệ số ĐC</Typography>
                                                      <TextFieldNumber
                                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.adjustmentNorm`}
                                                        formik={formik}
                                                        onValueChange={(val) => {
                                                          const baseNorm =
                                                            formik.values
                                                              .groups[gIdx]
                                                              .phases[pIdx]
                                                              .assignmentCodes[
                                                              cIdx
                                                            ].baseNorm || 0;
                                                          formik.setFieldValue(
                                                            `groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.norm`,
                                                            baseNorm * val,
                                                          );
                                                        }}
                                                      />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                      <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Định mức</Typography>
                                                      <TextFieldNumber
                                                        field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.norm`}
                                                        formik={formik}
                                                      />
                                                    </Box>
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={() => {
                                                        formik.setFieldValue(
                                                          `groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.checked`,
                                                          false,
                                                        );
                                                      }}
                                                    >
                                                      <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                  </Box>
                                                );
                                              },
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        )}
                      </FieldArray>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </FieldArray>
        )}

        <Divider sx={{ my: 2, opacity: 0.3 }} />
      </FormikProvider>
    </BaseModal>
  );
}
