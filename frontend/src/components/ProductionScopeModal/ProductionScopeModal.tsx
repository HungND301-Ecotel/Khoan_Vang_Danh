import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { ProductionScopeInputType, ProductionScopeOutputType, ExcavationTechType, HardnessType, PhaseGroupType, PhaseOutputType, StepType } from '../../types';

export default function ProductionScopeModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<ProductionScopeInputType>) => void; selected: ProductionScopeOutputType | null }) {
  const [selectedPhases, setSelectedPhases] = useState<PhaseGroupType[]>([])


  const { data: phasegroups = [] } = useQuery({
    queryKey: ['phasegroups'],
    queryFn: async () => api.get(`/phasegroups`).then(res => res.data.data),
  })

  console.log(selectedPhases)


  const formik = useFormik({
    initialValues: {
      code: selected?.code || '',
      name: selected?.name || '',
      phases: selected?.phases?.map((item) => ({
        phase: item.phase?._id,
        production: item.production
      })) || []
    },
    enableReinitialize: true,
    onSubmit: async (values) => {

      handleSubmit(values)
    }
  })

  useEffect(() => {
    if (phasegroups.length === 0) return;

    if (selected && selected.phases.length > 0) {
      // Trường hợp sửa
      const selectedCodes = phasegroups.filter((ac: any) =>
        selected.phases.some(norm => norm.phase?._id === ac._id)
      );
      setSelectedPhases(selectedCodes);
    }
  }, [selected, phasegroups]);

  const handleClose = () => {
    formik.resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{selected ? 'Chỉnh sửa diện sản xuất' : 'Tạo mới diện sản xuất'}</DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã diện sản xuất"
                value={formik.values.code}
                onChange={(event) => {
                  formik.setFieldValue("code", event.target.value);
                }}
              />
              <TextField
                fullWidth
                label="Tên diện sản xuất"
                value={formik.values.name}
                onChange={(event) => {
                  formik.setFieldValue("name", event.target.value);
                }}
              />
              <Autocomplete
                multiple
                options={phasegroups.filter((opt: PhaseGroupType) =>
                  !selectedPhases.some(selected => selected._id === opt._id)
                )}
                getOptionLabel={(option: PhaseGroupType) => option.name || ''}
                value={selectedPhases}
                onChange={(event, newValue) => {
                  setSelectedPhases(newValue);

                  // Cập nhật lại norms trong Formik khi thay đổi mã giao khoán
                  const updatedNorms = newValue.map((item) => {
                    const existing = formik.values.phases.find((n: any) => n.phase === item._id);
                    return {
                      phase: item._id,
                      production: existing?.production || undefined
                    };
                  });
                  formik.setFieldValue('phases', updatedNorms);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn công đoạn"
                    variant="outlined"
                    placeholder="Chọn..."
                  />
                )}
              />
              <FieldArray name="phases">
                {({ push, remove }) => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formik.values.phases.map((item: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          label="Mã công đoạn"
                          value={phasegroups.find((item: PhaseGroupType) => item._id === formik.values.phases[index].phase)?.code}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Tên công đoạn"
                          name={`phases[${index}].phase`}
                          value={phasegroups.find((item: PhaseGroupType) => item._id === formik.values.phases[index].phase)?.name}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Sản lượng"
                          type="number"
                          name={`phases[${index}].production`}
                          value={formik.values.phases[index]?.production || ''}
                          onChange={(e) => formik.setFieldValue(`phases[${index}].production`, e.target.value)}
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
