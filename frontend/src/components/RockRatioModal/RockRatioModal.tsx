import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { RockRatioType } from '../../types'


const validationSchema = yup.object({
  name: yup.string().required('Tỉ lệ đá lẫn trong gương không được để trống')
})
export default function RockRatioModal({ open, setOpen, handleSubmit, selectedRockRatio }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<RockRatioType>) => void; selectedRockRatio: RockRatioType | null }) {

  const formik = useFormik({
    initialValues: {
      name: selectedRockRatio ? selectedRockRatio.name : ''
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
      <DialogTitle>{selectedRockRatio ? 'Sửa tỉ lệ' : 'Tạo mới tỉ lệ'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tỉ lệ đá lẫn trong gương"
              placeholder='VD: ≥ 20%'
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['≥', '≤', '<', '>', '%', '°', '=', '-', '_'].map((symbol) => (
              <Button
                key={symbol}
                variant="outlined"
                size="small"
                onClick={() => {
                  formik.setFieldValue('name', formik.values.name + symbol)
                  setTimeout(() => {
                    document.getElementById('name')?.focus()
                  }, 0)
                }}
              >
                {symbol}
              </Button>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedRockRatio ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
