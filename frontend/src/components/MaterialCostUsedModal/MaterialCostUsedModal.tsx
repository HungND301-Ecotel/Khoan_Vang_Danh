import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import * as yup from 'yup'
import { FieldArray, FormikProvider, useFormik } from 'formik'
import api from '../../config/api.config';
import { AssignmentCodeOutputType, AssignmentNormInputType, MaterialCostUsedInputType, MaterialCostUsedOutputType, ExcavationTechType, HardnessType, MaterialAssignmentOutputType, PhaseGroupType, PhaseOutputType, StepType, ProductionScopeOutputType, Materials } from '../../types';

export default function MaterialCostUsedModal({ open, setOpen, handleSubmit, selected }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void; selected: MaterialCostUsedOutputType | null }) {
  const [selectedMaterials, setSelectedMaterials] = useState<Materials[]>([])

  const { data: productionscopes = [] } = useQuery({
    queryKey: ['productionscopes'],
    queryFn: async () => api.get('/productionscopes').then(res => res.data.data)
  })
  const { data: materialassignments = [] } = useQuery({
    queryKey: ['materialassignments'],
    queryFn: async () => api.get('/materialassignments/getAll').then(res => res.data.data)
  })


  const formik = useFormik({
    initialValues: {
      code: selected?.code || '',
      productionScope: selected?.productionScope?._id || '',
      materials: selected?.materials?.map((item) => ({
        material: item.material?._id,
        quantity: item.quantity
      })) || materialassignments.map((item: Materials) => ({
        material: item._id,
        quantity: undefined
      }))
    },
    enableReinitialize: true,
    onSubmit: async (values) => {

      handleSubmit(values)
    }
  })

  useEffect(() => {
    if (materialassignments.length === 0) return;

    if (selected && selected.materials.length > 0) {
      // Trường hợp sửa
      const selectedCodes = materialassignments.filter((ac: Materials) =>
        selected.materials.some(material => material.material?._id === ac._id)
      );
      setSelectedMaterials(selectedCodes);
    } else {
      setSelectedMaterials(materialassignments);
    }
  }, [selected, materialassignments]);

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
                label="Mã diện sản xuất"
                variant="outlined"
                value={formik.values.productionScope}
                onChange={(event) => {
                  formik.setFieldValue("productionScope", event.target.value);
                }}
              >
                {
                  productionscopes?.map((item: ProductionScopeOutputType) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.code}
                    </MenuItem>
                  ))
                }
              </TextField>
              <TextField
                fullWidth
                label="Mã chi phí"
                value={formik.values.code}
                onChange={(event) => {
                  formik.setFieldValue("code", event.target.value);
                }}
              />
              <Autocomplete
                multiple
                options={materialassignments.filter((opt: Materials) =>
                  !selectedMaterials.some(selected => selected._id === opt._id)
                )}
                getOptionLabel={(option: Materials) => option.code || ''}
                value={selectedMaterials}
                onChange={(event, newValue) => {
                  setSelectedMaterials(newValue);

                  // Cập nhật lại norms trong Formik khi thay đổi mã giao khoán
                  const updatedNorms = newValue.map((item) => {
                    const existing = formik.values.materials.find((n: any) => n.material === item._id);
                    return {
                      material: item._id,
                      quantity: existing?.norm || undefined
                    };
                  });
                  formik.setFieldValue('materials', updatedNorms);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn vật tư"
                    variant="outlined"
                    placeholder="Chọn..."
                  />
                )}
              />
              <FieldArray name="norms">
                {({ push, remove }) => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formik.values.materials.map((item: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          label="Mã vật tư"
                          value={materialassignments.find((item: Materials) => item._id === formik.values.materials[index].material)?.code}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Tên vật tư, tài sản"
                          name={`materials[${index}].assignmentCode`}
                          value={materialassignments.find((item: Materials) => item._id === formik.values.materials[index].material)?.name}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Số lượng"
                          type="number"
                          name={`materials[${index}].quantity`}
                          value={formik.values.materials[index]?.quantity || ''}
                          onChange={(e) => formik.setFieldValue(`materials[${index}].quantity`, e.target.value)}
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
