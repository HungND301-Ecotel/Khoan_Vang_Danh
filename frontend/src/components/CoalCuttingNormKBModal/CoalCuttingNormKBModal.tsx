import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { AssignmentCodeOutputType, CrossSectionInputType, CoalCuttingNormKBInputType, CoalCuttingNormKBOutputType, ExcavationTechType, HardnessType, PhaseGroupType, PhaseOutputType, StepType, ThicknessType, LengthType } from '../../types';

const validationSchema = yup.object().shape({
  norms: yup.array().of(
    yup.object().shape({
      assignmentCode: yup.string().required('Bắt buộc'),
      norm: yup.number().typeError('Phải là số').required('Bắt buộc'),
    })
  ).min(1, 'Phải có ít nhất 1 định mức'),
});
export default function CuttingNormKBModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<CoalCuttingNormKBInputType>) => void; selected: CoalCuttingNormKBOutputType | null }) {
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<AssignmentCodeOutputType[]>([])
  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ['assignmentcodes'],
    queryFn: async () => api.get(`/assignmentcodes`).then(res => res.data.data),
  })
  const { data: hardness = [] } = useQuery({
    queryKey: ['hardness'],
    queryFn: async () => api.get(`/hardness`).then(res => res.data.data),
  })
  const { data: thickness = [] } = useQuery({
    queryKey: ['thickness'],
    queryFn: async () => api.get(`/thickness`).then(res => res.data.data),
  })
  const { data: curbslopes = [] } = useQuery({
    queryKey: ['curbslopes'],
    queryFn: async () => api.get(`/curbslopes`).then(res => res.data.data),
  })


  const formik = useFormik({
    initialValues: {
      hardness: selected?.hardness?._id || '',
      code: selected?.code || '',
      curbSlope: selected?.curbSlope?._id || '',
      thickness: selected?.thickness?._id || '',
      norms: selected?.norms?.map((item) => ({
        assignmentCode: item.assignmentCode._id,
        norm: item.norm
      })) || assignmentcodes.map((item: any) => ({
        assignmentCode: item._id,
        norm: undefined
      }))
    },
    enableReinitialize: true,
    validationSchema,
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
      <DialogTitle>{selected ? 'Chỉnh sửa' : 'Thêm mới'}</DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth select label="Độ dày vỉa" variant="outlined"
                value={formik.values.thickness}
                onChange={(event) => {
                  formik.setFieldValue("thickness", event.target.value);
                }}
                error={formik.touched.thickness && Boolean(formik.errors.thickness)}
                helperText={formik.touched.thickness && formik.errors.thickness}>
                {
                  thickness?.map((item: ThicknessType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField fullWidth select label="Độ dốc vỉa" variant="outlined"
                value={formik.values.curbSlope}
                onChange={(event) => {
                  formik.setFieldValue("curbSlope", event.target.value);
                }}
                error={formik.touched.curbSlope && Boolean(formik.errors.curbSlope)}
                helperText={formik.touched.curbSlope && formik.errors.curbSlope}>
                {
                  curbslopes?.map((item: LengthType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
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
                          value={selectedAssignmentCodes.find((item: AssignmentCodeOutputType) => item._id === formik.values.norms[index]?.assignmentCode)?.code}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Tên vật tư, tài sản"
                          name={`norms[${index}].assignmentCode`}
                          value={selectedAssignmentCodes.find((item: AssignmentCodeOutputType) => item._id === formik.values.norms[index]?.assignmentCode)?.name}
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
