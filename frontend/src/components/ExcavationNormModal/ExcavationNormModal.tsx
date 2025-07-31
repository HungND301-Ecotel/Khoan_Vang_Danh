import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { AssignmentCodeOutputType, ExcavationNormInputType, ExcavationNormOutputType, ExcavationTechType, HardnessType, PhaseGroupType, PhaseOutputType, StepType } from '../../types';

export default function ExcavationNormModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<ExcavationNormInputType>) => void; selected: ExcavationNormOutputType | null }) {
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null)
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<AssignmentCodeOutputType[]>([])

  const { data: phasegroups = [] } = useQuery({
    queryKey: ['phasegroups'],
    queryFn: async () => api.get('/phasegroups').then(res => res.data.data)
  })
  const { data: phases = [] } = useQuery({
    queryKey: ['phases', phaseGroup],
    queryFn: async () => api.get(`/phases?phaseGroup=${phaseGroup}`).then(res => res.data.data),
    enabled: !!phaseGroup,
  })

  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ['assignmentcodes'],
    queryFn: async () => api.get(`/assignmentcodes`).then(res => res.data.data),
  })
  const { data: steps = [] } = useQuery({
    queryKey: ['steps'],
    queryFn: async () => api.get(`/steps`).then(res => res.data.data),
  })
  const { data: hardness = [] } = useQuery({
    queryKey: ['hardness'],
    queryFn: async () => api.get(`/hardness`).then(res => res.data.data),
  })
  const { data: excavationtechs = [] } = useQuery({
    queryKey: ['excavationtechs'],
    queryFn: () => api.get('/excavationtechs').then(res => res.data.data)
  })

  useEffect(() => {
    if (selected?.phaseGroup?._id) {
      setPhaseGroup(selected.phaseGroup._id);
    }
  }, [selected]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: selected?.phaseGroup?._id || '',
      phase: selected?.phase?._id || '',
      step: selected?.step?._id || '',
      hardness: selected?.hardness?._id || '',
      code: selected?.code || '',
      excavationTech: selected?.excavationTech?._id || '',
      norms: selected?.norms?.map((item) => ({
        assignmentCode: item.assignmentCode._id,
        norm: item.norm
      })) || assignmentcodes.map((item: any) => ({
        assignmentCode: item._id,
        norm: undefined
      }))
    },
    enableReinitialize: true,
    onSubmit: async (values) => {

      handleSubmit({
        ...values,
        hardness: values.hardness || undefined,
      })
    }
  })

  useEffect(() => {
    if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      // Trường hợp sửa
      const selectedCodes = assignmentcodes.filter((ac: any) =>
        selected.norms.some(norm => norm.assignmentCode._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else {
      setSelectedAssignmentCodes(assignmentcodes);
    }
  }, [selected, assignmentcodes]);

  const handleClose = () => {
    formik.resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{selected ? 'Chỉnh sửa định mức đào lò' : 'Tạo mới định mức đào lò'}</DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth select
                label="Nhóm công đoạn"
                variant="outlined"
                value={formik.values.phaseGroup}
                onChange={(event) => {
                  setPhaseGroup(event.target.value)
                  formik.setFieldValue("phaseGroup", event.target.value);
                }}
              >
                {
                  phasegroups?.map((group: PhaseGroupType) => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField fullWidth select label="Công đoạn" variant="outlined"
                value={formik.values.phase}
                onChange={(event) => {
                  formik.setFieldValue("phase", event.target.value);
                }}
                error={formik.touched.phase && Boolean(formik.errors.phase)}
                helperText={formik.touched.phase && formik.errors.phase}>
                {
                  phases?.map((phase: PhaseOutputType) => (
                    <MenuItem key={phase._id} value={phase._id}>
                      {phase.name}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField fullWidth select label="Công nghệ xúc" variant="outlined"
                value={formik.values.excavationTech}
                onChange={(event) => {
                  formik.setFieldValue("excavationTech", event.target.value);
                }}
                error={formik.touched.excavationTech && Boolean(formik.errors.excavationTech)}
                helperText={formik.touched.excavationTech && formik.errors.excavationTech}>
                {
                  excavationtechs?.map((excavationtech: ExcavationTechType) => (
                    <MenuItem key={excavationtech._id} value={excavationtech._id}>
                      {excavationtech.name}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField fullWidth select label="Độ cứng" variant="outlined"
                value={formik.values.hardness}
                onChange={(event) => {
                  formik.setFieldValue("hardness", event.target.value);
                }}
                error={formik.touched.hardness && Boolean(formik.errors.hardness)}
                helperText={formik.touched.hardness && formik.errors.hardness}>
                {
                  hardness?.map((item: HardnessType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField fullWidth select label="Chống" variant="outlined"
                value={formik.values.step}
                onChange={(event) => {
                  formik.setFieldValue("step", event.target.value);
                }}
                error={formik.touched.step && Boolean(formik.errors.step)}
                helperText={formik.touched.step && formik.errors.step}>
                {
                  steps?.map((step: StepType) => (
                    <MenuItem key={step._id} value={step._id}>
                      {step.name}
                    </MenuItem>
                  ))
                }
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
                options={assignmentcodes.filter((opt: AssignmentCodeOutputType) =>
                  !selectedAssignmentCodes.some(selected => selected._id === opt._id)
                )}
                getOptionLabel={(option: AssignmentCodeOutputType) => option.code || ''}
                value={selectedAssignmentCodes}
                onChange={(event, newValue) => {
                  setSelectedAssignmentCodes(newValue);

                  // Cập nhật lại norms trong Formik khi thay đổi mã giao khoán
                  const updatedNorms = newValue.map((item) => {
                    const existing = formik.values.norms.find((n: any) => n.assignmentCode === item._id);
                    return {
                      assignmentCode: item._id,
                      norm: existing?.norm || undefined
                    };
                  });
                  formik.setFieldValue('norms', updatedNorms);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn mã giao khoán"
                    variant="outlined"
                    placeholder="Chọn..."
                  />
                )}
              />
              <FieldArray name="norms">
                {({ push, remove }) => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formik.values.norms.map((item: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          label="Mã giao khoán"
                          value={assignmentcodes.find((item: AssignmentCodeOutputType) => item._id === formik.values.norms[index].assignmentCode)?.code}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Tên vật tư, tài sản"
                          name={`norms[${index}].assignmentCode`}
                          value={assignmentcodes.find((item: AssignmentCodeOutputType) => item._id === formik.values.norms[index].assignmentCode)?.name}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Định mức"
                          type="number"
                          name={`norms[${index}].norm`}
                          value={formik.values.norms[index]?.norm || ''}
                          onChange={(e) => formik.setFieldValue(`norms[${index}].norm`, e.target.value)}
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
          {selected ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
