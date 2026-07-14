import {
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction, useState, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import { FieldArray, FormikProvider, useFormik } from "formik";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";

import BaseModal from "../../../components/Common/BaseModal";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { InitialPlannedCostInputType, BaseConfigModalProps } from "../../../types";
import { systemConfigsAtom } from "../../../atoms/systemConfigAtoms";
import { SYSTEM_KEYS } from "../../../utils/constant";
import FieldMonthYear from "../../../ui/FieldMonth_Year";

import { useModalQueries } from "./useModalQueries";
import { useInitialValues } from "./useInitialValues";
import { validationSchema } from "./Validation";
import GroupScopeSection from "./GroupScopeSection";

export default function InitialPlannedCostModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  minimizedData,
  onMinimize,
  clearMinimize,
}: BaseConfigModalProps<InitialPlannedCostInputType, any>) {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);

  const systemConfigs = useAtomValue(systemConfigsAtom);
  const cuttingPhaseGroupKey = useMemo(() => {
    return systemConfigs.find((c) => c.key === SYSTEM_KEYS.KHAU_THAN)?.value || "";
  }, [systemConfigs]);

  const {
    productionscopes,
    phases,
    assignmentnorms,
    departments,
    adjustmentnorms,
  } = useModalQueries();

  const initialValues = useInitialValues(selected, minimizedData, cuttingPhaseGroupKey);

  const toggleExpand = (index: number) => {
    setExpandedGroups((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const emptyPhase = () => ({
    phase: "",
    production: 0,
    unit: "mét",
    assignmentNormCode: undefined,
    adjustmentNormCode: undefined,
    assignmentCodes: [],
  });

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        department: values.department,
        month: dayjs(new Date(values.month)).format("YYYY-MM"),
        groups: values.groups.map((g: any) => ({
          productionScope: g.productionScope,
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

      if (selected?._id) {
        // Edit 1 bản ghi
        handleSubmit({
          ...payload.groups[0],
          _id: values._id,
          department: values.department,
          month: values.month,
        });
      } else {
        handleSubmit(payload);
      }
    },
  });



  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    setExpandedGroups([0]);
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize({
        ...formik.values,
        _id: selected?._id || minimizedData?._id,
      });
    }
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
      onMinimize={handleMinimize}
      title={(selected?._id || minimizedData?._id)
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
        formik.values.month && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => {
              const newGroup = {
                productionScope: "",
                phases: [],
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
            Thêm diện
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
            {(selected?._id || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
              Phân xưởng
            </Typography>
            <FieldAutoCompleted
              formik={formik}
              field="department"
              title=""
              labelkey="name"
              data={departments.data}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
              Thời gian
            </Typography>
            <FieldMonthYear formik={formik} fieldName="month" />
            {formik.touched.month && formik.errors.month && (
              <Typography color="error" variant="caption">
                {String(formik.errors.month)}
              </Typography>
            )}
          </Box>
        </Box>

        {formik.values.month && (
          <FieldArray name="groups">
            {({ remove }) => (
              <Box sx={{ mt: 2 }}>
                {formik.values.groups.map((group, gIdx) => (
                  <GroupScopeSection
                    key={gIdx}
                    formik={formik}
                    gIdx={gIdx}
                    group={group}
                    expandedGroups={expandedGroups}
                    toggleExpand={toggleExpand}
                    setExpandedGroups={setExpandedGroups}
                    remove={remove}
                    emptyPhase={emptyPhase}
                    selected={selected}
                    productionscopesData={productionscopes.data}
                    phasesData={phases.data}
                    assignmentnormsData={assignmentnorms.data}
                    adjustmentnormsData={adjustmentnorms.data}
                    getError={getError}
                  />
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
