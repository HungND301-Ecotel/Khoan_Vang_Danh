import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { MirrorRatioType } from '../../types'


const validationSchema = yup.object({
  name: yup.string().required('Tỉ lệ gương than mềm không được để trống')
})
export default function MirrorRatioModal({ open, setOpen, handleSubmit, selectedMirrorRatio }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<MirrorRatioType>) => void; selectedMirrorRatio: MirrorRatioType | null }) {

  const formik = useFormik({
    initialValues: {
      name: selectedMirrorRatio ? selectedMirrorRatio.name : ''
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
      <DialogTitle>{selectedMirrorRatio ? 'Sửa tỉ lệ' : 'Tạo mới tỉ lệ'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tỉ lệ gương than mềm"
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
          {selectedMirrorRatio ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
