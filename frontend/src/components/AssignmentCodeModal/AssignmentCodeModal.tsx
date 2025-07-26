import { YouTube } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import React, { Dispatch, SetStateAction } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { AssignmentCodeInputType, AssignmentCodeOutputType, UnitType } from '../../types'
import { useQuery } from '@tanstack/react-query'
import api from '../../config/api.config'


const validationSchema = yup.object({
  name: yup.string().required('Tên giao khoán không được để trống')
})
export default function AssignmentCodeModal({ open, setOpen, handleSubmit, selectedAssignmentCode }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; handleSubmit: (values: Partial<AssignmentCodeInputType>) => void; selectedAssignmentCode: AssignmentCodeOutputType | null }) {

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get('/units').then(res => res.data.data)
  })
  const formik = useFormik({
    initialValues: {
      code: selectedAssignmentCode ? selectedAssignmentCode.code : '',
      name: selectedAssignmentCode ? selectedAssignmentCode.name : '',
      uom: selectedAssignmentCode ? selectedAssignmentCode.uom?._id : '',
      price: selectedAssignmentCode ? selectedAssignmentCode.price : undefined,
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
      <DialogTitle>{selectedAssignmentCode ? 'Sửa' : 'Thêm mới'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Mã"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Tên giao khoán"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
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
            <TextField
              fullWidth
              id="price"
              name="price"
              label="Đơn giá"
              value={formik.values.price}
              onChange={formik.handleChange}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedAssignmentCode ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
