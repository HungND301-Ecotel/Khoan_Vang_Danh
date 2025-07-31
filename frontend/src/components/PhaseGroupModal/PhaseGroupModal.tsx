import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { PhaseGroupType } from '../../types'


const validationSchema = yup.object({
  name: yup.string().required('Tên nhóm công đoạn không được để trống')
})
export default function PhaseGroupModal({ open, setOpen, handleSubmit, selectedPhaseGroup }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<PhaseGroupType>) => void; selectedPhaseGroup: PhaseGroupType | null }) {

  const formik = useFormik({
    initialValues: {
      code: selectedPhaseGroup ? selectedPhaseGroup.code : '',
      name: selectedPhaseGroup ? selectedPhaseGroup.name : ''
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
      <DialogTitle>{selectedPhaseGroup ? 'Sửa nhóm công đoạn' : 'Tạo mới nhóm công đoạn'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Mã nhóm công đoạn"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tên nhóm công đoạn"
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
          {selectedPhaseGroup ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
