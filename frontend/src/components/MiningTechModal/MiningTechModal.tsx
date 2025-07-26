import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { MiningtechType } from '../../types'


const validationSchema = yup.object({
  code: yup.string().required('Mã công nghệ khai thác không được để trống'),
  name: yup.string().required('Tên công nghệ khai thác không được để trống')
})
export default function MiningTechModal({ open, setOpen, handleSubmit, selectedMiningTech }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<MiningtechType>) => void; selectedMiningTech: MiningtechType | null }) {

  const formik = useFormik({
    initialValues: {
      code: selectedMiningTech ? selectedMiningTech.code : '',
      name: selectedMiningTech ? selectedMiningTech.name : ''
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
      <DialogTitle>{selectedMiningTech ? 'Sửa' : 'Thêm mới'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Mã công nghệ khai thác"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tên công nghệ khai thác"
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
          {selectedMiningTech ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
