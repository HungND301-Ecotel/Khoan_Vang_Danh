import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { StepType } from '../../types'


const validationSchema = yup.object({
  name: yup.string().required('Bước chống không được để trống')
})
export default function StepModal({ open, setOpen, handleSubmit, selectedStep }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<StepType>) => void; selectedStep: StepType | null }) {

  const formik = useFormik({
    initialValues: {
      name: selectedStep ? selectedStep.name : ''
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
      <DialogTitle>{selectedStep ? 'Sửa bước chống' : 'Tạo mới bước chống'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Bước chống"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedStep ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
