import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { DeviceCodeType } from '../../types'


const validationSchema = yup.object({
  code: yup.string().required('Mã thiết bị không được để trống')
})
export default function DeviceCode({ open, setOpen, handleSubmit, selectedDeviceCode }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<DeviceCodeType>) => void; selectedDeviceCode: DeviceCodeType | null }) {

  const formik = useFormik({
    initialValues: {
      code: selectedDeviceCode ? selectedDeviceCode.code : ''
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
      <DialogTitle>{selectedDeviceCode ? 'Chỉnh sửa mã thiết bị' : 'Tạo mới mã thiết bị'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Mã thiết bị"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedDeviceCode ? 'Cập nhật' : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
