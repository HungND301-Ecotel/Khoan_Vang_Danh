import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { CrossSectionOutputType, CrossSectionInputType, UnitType } from '../../types'
import { useQuery } from '@tanstack/react-query'
import api from '../../config/api.config'


const validationSchema = yup.object({
  name: yup.string().required('Tiết diện lò xén k được để trống'),
})
export default function CrossSection({ open, setOpen, handleSubmit, selectedCrossSection }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<CrossSectionInputType>) => void; selectedCrossSection: CrossSectionOutputType | null }) {
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get('/units').then(res => res.data.data)
  })
  const formik = useFormik({
    initialValues: {
      name: selectedCrossSection ? selectedCrossSection.name : '',
      uom: selectedCrossSection ? selectedCrossSection.uom?._id : '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      handleSubmit(values)
    }
  })

  const handleClose = () => {
    formik.resetForm()
    setOpen(false)
  }
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{selectedCrossSection ? 'Sửa tiết diện lò xén' : 'Tạo mới tiết diện lò xén'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tiết diện lò xén"
              placeholder='VD: 2≤Sx<4'
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />

            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['≥', '≤', '<', '>', '%', '°', '='].map((symbol) => (
                <Button
                  key={symbol}
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    formik.setFieldValue('name', formik.values.name + symbol)
                  }
                >
                  {symbol}
                </Button>
              ))}
            </Box>
            <TextField
              fullWidth
              select
              id="uom"
              name="uom"
              label="Đơn vị tính"
              value={formik.values.uom}
              onChange={formik.handleChange}
              error={formik.touched.uom && Boolean(formik.errors.uom)}
              helperText={formik.touched.uom && formik.errors.uom}
            >
              {units.map((unit: UnitType) => (
                <MenuItem key={unit._id} value={unit._id}>{unit.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedCrossSection ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
