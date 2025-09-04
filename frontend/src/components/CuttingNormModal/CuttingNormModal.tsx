import { useQuery } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../config/api.config";
import {
  AssignmentCodeOutputType,
  CrossSectionInputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  ExcavationTechType,
  HardnessType,
  PhaseGroupType,
  PhaseOutputType,
  StepType,
} from "../../types";

export default function CuttingNormModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentNormInputType>) => void;
  selected: AssignmentNormOutputType | null;
}) {
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);

  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get("/phasegroups").then((res) => res.data.data),
  });
  const { data: phases = [] } = useQuery({
    queryKey: ["phases", phaseGroup],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroup}`).then((res) => res.data.data),
    enabled: !!phaseGroup,
  });

  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: hardness = [] } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });
  const { data: crosssections = [] } = useQuery({
    queryKey: ["crosssections"],
    queryFn: () => api.get("/crosssections").then((res) => res.data.data),
  });

  useEffect(() => {
    setPhaseGroup(
      phasegroups.find(
        (p: PhaseGroupType) => p.name?.toLowerCase() === "xén lò".toLowerCase()
      )?._id
    );
  }, [phasegroups]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: phaseGroup || "",
      phase: selected?.phase?._id || "",
      hardness: selected?.hardness?._id || "",
      code: selected?.code || "",
      crossSection: selected?.crossSection?._id || "",
      type: "cutting",
      norms:
        selected?.norms && selected.norms.length > 0
          ? selected.norms.map((item) => ({
              assignmentCode: item.assignmentCode?._id, // dùng optional chaining để tránh null
              norm: item.norm,
            }))
          : assignmentcodes.map((item: any) => ({
              assignmentCode: item._id,
              norm: undefined,
            })),
    },
    enableReinitialize: true,
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
      });
    },
  });
  useEffect(() => {
    if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      const selectedCodes = assignmentcodes.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else {
      setSelectedAssignmentCodes(assignmentcodes);
    }
  }, [selected, assignmentcodes]);
  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selected ? "Chỉnh sửa nhóm công đoạn" : "Tạo mới nhóm công đoạn"}
      </DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Nhóm công đoạn"
                variant="outlined"
                value={formik.values.phaseGroup}
                InputProps={{ readOnly: true }}
                onChange={(event) => {
                  setPhaseGroup(event.target.value);
                  formik.setFieldValue("phaseGroup", event.target.value);
                }}
              >
                {phasegroups?.map((group: PhaseGroupType) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Công đoạn"
                variant="outlined"
                value={formik.values.phase}
                onChange={(event) => {
                  formik.setFieldValue("phase", event.target.value);
                }}
                error={formik.touched.phase && Boolean(formik.errors.phase)}
                helperText={formik.touched.phase && formik.errors.phase}
              >
                {phases?.map((phase: PhaseOutputType) => (
                  <MenuItem key={phase._id} value={phase._id}>
                    {phase.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Tiết diện lò xén"
                variant="outlined"
                value={formik.values.crossSection}
                onChange={(event) => {
                  formik.setFieldValue("crossSection", event.target.value);
                }}
                error={
                  formik.touched.crossSection &&
                  Boolean(formik.errors.crossSection)
                }
                helperText={
                  formik.touched.crossSection && formik.errors.crossSection
                }
              >
                {crosssections?.map((crosssection: CrossSectionInputType) => (
                  <MenuItem key={crosssection._id} value={crosssection._id}>
                    {crosssection.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Độ cứng"
                variant="outlined"
                value={formik.values.hardness}
                onChange={(event) => {
                  formik.setFieldValue("hardness", event.target.value);
                }}
                error={
                  formik.touched.hardness && Boolean(formik.errors.hardness)
                }
                helperText={formik.touched.hardness && formik.errors.hardness}
              >
                {hardness?.map((item: HardnessType) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Mã định mức"
                value={formik.values.code}
                onChange={(event) => {
                  formik.setFieldValue("code", event.target.value);
                }}
              />
              <Autocomplete
                multiple
                options={assignmentcodes.filter(
                  (opt: AssignmentCodeOutputType) =>
                    !selectedAssignmentCodes.some(
                      (selected) => selected._id === opt._id
                    )
                )}
                getOptionLabel={(option: AssignmentCodeOutputType) =>
                  option.code || ""
                }
                value={selectedAssignmentCodes}
                onChange={(event, newValue) => {
                  setSelectedAssignmentCodes(newValue);

                  // Cập nhật lại norms trong Formik khi thay đổi mã giao khoán
                  const updatedNorms = newValue.map((item) => {
                    const existing = formik.values.norms.find(
                      (n: any) => n.assignmentCode === item._id
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
                    label="Mã giao khoán"
                    variant="outlined"
                    placeholder="Chọn..."
                  />
                )}
              />
              <FieldArray name="norms">
                {({ push, remove }) => (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {formik.values.norms.map((item: any, index: number) => (
                      <Box
                        key={index}
                        sx={{ display: "flex", gap: 2, alignItems: "center" }}
                      >
                        <TextField
                          fullWidth
                          label="Mã giao khoán"
                          value={
                            assignmentcodes.find(
                              (item: AssignmentCodeOutputType) =>
                                item._id ===
                                formik.values.norms[index].assignmentCode
                            )?.code
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Tên vật tư, tài sản"
                          name={`norms[${index}].assignmentCode`}
                          value={
                            assignmentcodes.find(
                              (item: AssignmentCodeOutputType) =>
                                item._id ===
                                formik.values.norms[index].assignmentCode
                            )?.name
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Định mức"
                          type="number"
                          name={`norms[${index}].norm`}
                          value={formik.values.norms[index]?.norm || ""}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `norms[${index}].norm`,
                              e.target.value
                            )
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </FieldArray>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selected ? "Cập nhật" : "Thêm mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}