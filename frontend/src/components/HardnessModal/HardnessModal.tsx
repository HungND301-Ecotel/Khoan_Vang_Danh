import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { HardnessType, UnitType } from '../../types'
import { useQuery } from '@tanstack/react-query'
import api from '../../config/api.config'

const validationSchema = yup.object({
  name: yup.string().required('Vui lòng nhập độ cứng'),
})

export default function HardnessModal({
  open,
  setOpen,
  handleSubmit,
  selectedHardness,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  handleSubmit: (values: Partial<HardnessType>) => void
  selectedHardness: HardnessType | null
}) {
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async (): Promise<UnitType[]> => {
      const res = await api.get('/units')
      // console.log(res.data)
      return res.data.data as UnitType[]
    },
  })

  const formik = useFormik({
    initialValues: {
      name: selectedHardness ? selectedHardness.name : '',
      uom: selectedHardness ? selectedHardness.uom?._id || '' : '', // Đảm bảo không bao giờ là undefined
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const payload: Partial<HardnessType> = {
        name: values.name,
        uom: values.uom ? ({ _id: values.uom } as UnitType) : undefined,
      }
      handleSubmit(payload)
    },
  })

  const handleClose = () => {
    formik.resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{selectedHardness ? 'Sửa độ cứng' : 'Tạo mới độ cứng'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Độ cứng"
              placeholder="VD: f=3-4"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />

            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['≥', '≤', '<', '>', '%', '°', '=', '-'].map((symbol) => (
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
              value={formik.values.uom || ''} 
              onChange={formik.handleChange}
              error={formik.touched.uom && Boolean(formik.errors.uom)}
              helperText={formik.touched.uom && formik.errors.uom}
            >
              {units.map((unit: UnitType) => (
                <MenuItem key={unit._id} value={unit._id}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedHardness ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}