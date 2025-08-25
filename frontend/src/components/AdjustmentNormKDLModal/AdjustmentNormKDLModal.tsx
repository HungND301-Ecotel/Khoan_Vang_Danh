import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { AssignmentCodeOutputType, AdjustmentNormInputType, AdjustmentNormOutputType, ExcavationTechType, HardnessType, PhaseGroupType, PhaseOutputType, StepType } from '../../types';

export default function AdjustmentNormKDLModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<AdjustmentNormInputType>) => void; selected: AdjustmentNormOutputType | null }) {
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<AssignmentCodeOutputType[]>([])


  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ['assignmentcodes'],
    queryFn: async () => api.get(`/assignmentcodes`).then(res => res.data.data),
  })
  const { data: rockratios = [] } = useQuery({
    queryKey: ['rockratios'],
    queryFn: async () => api.get(`/rockratios`).then(res => res.data.data),
  })
  const { data: hardness = [] } = useQuery({
    queryKey: ['hardness'],
    queryFn: async () => api.get(`/hardness`).then(res => res.data.data),
  })


  const formik = useFormik({
    initialValues: {
      hardness: selected?.hardness?._id || '',
      rockRatio: selected?.rockRatio?._id || '',
      code: selected?.code || '',
      type: 'CKĐL',
      norms: selected?.norms?.map((item) => ({
        assignmentCode: item.assignmentCode?._id || '',
        norm: item.norm
      })) || []
    },
    enableReinitialize: true,
    onSubmit: async (values) => {

      handleSubmit({
        ...values,
        hardness: values.hardness || undefined,
        type: values.type as 'CM' | 'CKKT' | 'CKĐL'
      })
    }
  })

  useEffect(() => {
    if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      // Trường hợp sửa
      const selectedCodes = assignmentcodes.filter((ac: any) =>
        selected.norms.some(norm => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    }
  }, [selected, assignmentcodes]);

  const handleClose = () => {
    formik.resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{selected ? 'Chỉnh sửa hệ số điều chỉnh định mức' : 'Tạo mới hệ số điều chỉnh định mức'}</DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth select label="Chọn độ cứng của đá lẫn trong gương (f) " variant="outlined"
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
              <TextField fullWidth select label="Chọn tỷ lệ đá lẫn trong gương (Ckẹp)" variant="outlined"
                value={formik.values.rockRatio}
                onChange={(event) => {
                  formik.setFieldValue("rockRatio", event.target.value);
                }}
                error={formik.touched.rockRatio && Boolean(formik.errors.rockRatio)}
                helperText={formik.touched.rockRatio && formik.errors.rockRatio}>
                {
                  rockratios?.map((step: StepType) => (
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
