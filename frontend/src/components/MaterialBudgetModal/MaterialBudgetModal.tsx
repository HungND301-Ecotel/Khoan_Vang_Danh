import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { AdjustmentNormOutputType, AssignmentCodeOutputType, AssignmentNormOutputType, CoalCuttingNormKBOutputType, ExcavationNormInputType, ExcavationNormOutputType, ExcavationTechType, HardnessType, MaterialBudgetInputType, PhaseGroupType, PhaseOutputType, StepType } from '../../types';

export default function MaterialBudgetModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>, handleSubmit: (values: Partial<MaterialBudgetInputType>) => void; selected: MaterialBudgetInputType | null }) {
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null)

  const { data: phasegroups = [] } = useQuery({
    queryKey: ['phasegroups'],
    queryFn: async () => api.get('/phasegroups').then(res => res.data.data)
  })
  const { data: phases = [] } = useQuery({
    queryKey: ['phases', phaseGroup],
    queryFn: async () => api.get(`/phases?phaseGroup=${phaseGroup}`).then(res => res.data.data),
    enabled: !!phaseGroup,
  })
  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ['assignmentnorms'],
    queryFn: async () => api.get('/assignmentnorms').then(res => res.data.data)
  })
  const { data: adjustmentnorms = [] } = useQuery({
    queryKey: ['adjustmentnorms'],
    queryFn: async () => api.get('/adjustmentnorms').then(res => res.data.data)
  })

  useEffect(() => {
    if (selected && phasegroups.length > 0) {
      setPhaseGroup(selected.phaseGroup || '')
    }

  }, [selected, phasegroups])


  const formik = useFormik({
    initialValues: {
      code: selected?.code || '',
      phaseGroup: phaseGroup || '',
      phase: selected?.phase || '',
      assignmentNormCode: selected?.assignmentNormCode || '',
      adjustmentNormCode: selected?.adjustmentNormCode || '',
      production: selected?.production || undefined,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      handleSubmit(values)
    }
  })


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
              <TextField fullWidth select label="Mã định mức giao khoán" variant="outlined"
                value={formik.values.assignmentNormCode}
                onChange={(event) => {
                  formik.setFieldValue("assignmentNormCode", event.target.value);
                }}
                error={formik.touched.assignmentNormCode && Boolean(formik.errors.assignmentNormCode)}
                helperText={formik.touched.assignmentNormCode && formik.errors.assignmentNormCode}>
                {
                  assignmentnorms?.map((item: AssignmentNormOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField
                fullWidth
                type="number"
                name="production"
                label="Sản lượng"
                value={formik.values.production}
                onChange={(event) => {
                  formik.setFieldValue("production", event.target.value);
                }}
                error={formik.touched.production && Boolean(formik.errors.production)}
                helperText={formik.touched.production && formik.errors.production}
              />

              <TextField
                fullWidth
                label="Mã chi phí"
                value={formik.values.code}
                onChange={(event) => {
                  formik.setFieldValue("code", event.target.value);
                }}
              />
              <TextField fullWidth select label="Mã định hệ số điều chỉnh định mức" variant="outlined"
                value={formik.values.adjustmentNormCode}
                onChange={(event) => {
                  formik.setFieldValue("adjustmentNormCode", event.target.value);
                }}
                error={formik.touched.adjustmentNormCode && Boolean(formik.errors.adjustmentNormCode)}
                helperText={formik.touched.adjustmentNormCode && formik.errors.adjustmentNormCode}>
                {
                  adjustmentnorms?.map((item: AdjustmentNormOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))
                }
              </TextField>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selected ? 'Chỉnh sửa' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
