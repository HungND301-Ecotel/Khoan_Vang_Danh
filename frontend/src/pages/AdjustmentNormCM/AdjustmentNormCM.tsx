import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AdjustmentNormInputType, AdjustmentNormOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import AdjustmentNormCMModal from '../../components/AdjustmentNormCMModal/AdjustmentNormCMModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


export default function AdjustmentNormCM() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormOutputType | null>(null)
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: adjustmentnorms = [] } = useQuery({
    queryKey: ['adjustmentnorms'],
    queryFn: async () => api.get('/adjustmentnorms').then(res => res.data.data)
  })

  const handleToggleExpand = (axcavationnorm: AdjustmentNormOutputType) => {
    const id = axcavationnorm?._id;
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
  };
  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AdjustmentNormInputType>) =>
      api.post('/adjustmentnorms', newExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnorms'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<AdjustmentNormInputType>) =>
      api.put(`/adjustmentnorms/${updateExcavationNorm._id}`, updateExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnorms'] });
      setOpen(false)
      setSelected(null)
      showSuccessAlert("Sửa thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleDelete = (id?: string) => {
    if (!id) {
      showErrorAlert('Không tìm thấy bản ghi');
      return;
    }
    showConfirmAlert('Bạn có muốn xóa bản ghi này?').then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id)
      }
    });
  };
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/adjustmentnorms/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnorms'] });
      showSuccessAlert('Xóa thành công')
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleSubmit = (values: Partial<AdjustmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (excavationNorm?: AdjustmentNormOutputType) => {
    if (excavationNorm) {
      setSelected(excavationNorm)
    } else {
      setSelected(null)
    }
    setOpen(true)
  }



  return (
    <Paper elevation={3} style={{ padding: 16 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Hệ số điều chỉnh định mức CM</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới Hệ số điều chỉnh định mức CM</Button>
      </Box>
      < TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Mã định mức giao khoán</b></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Thao tác</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustmentnorms.filter((i:AdjustmentNormOutputType)=>i.type==="CM").map((adjustmentnorm: AdjustmentNormOutputType) => (
              <React.Fragment>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>{adjustmentnorm.code}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>
                    <IconButton onClick={() => handleToggleExpand(adjustmentnorm)}>
                      <Visibility color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => handleOpen(adjustmentnorm)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(adjustmentnorm._id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {expandedRow === adjustmentnorm._id && (<TableRow>
                  <TableCell colSpan={3} sx={{ border: '1px solid black', backgroundColor: '#D3D3D3' }}>
                    < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align='center' colSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Tỷ lệ gương than mềm (Cm) </TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{adjustmentnorm.mirrorRatio?.name}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell align='center' colSpan={5} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{adjustmentnorm.code}</TableCell>
                          </TableRow>
                          {adjustmentnorm.norms.map((item: any, index: number) => (
                            <TableRow>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{index + 1}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black', color: 'blue' }}>{item.assignmentCode?.code}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.assignmentCode?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>1</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.norm ? item.norm.toLocaleString() : ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TableCell>
                </TableRow>)}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AdjustmentNormCMModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Paper >
  );
}
