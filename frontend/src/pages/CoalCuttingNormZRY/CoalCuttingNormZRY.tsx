import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { CoalCuttingNormZRYInputType, CoalCuttingNormZRYOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import CoalCuttingNormZRYModal from '../../components/CoalCuttingNormZRYModal/CoalCuttingNormZRYModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


export default function CoalCuttingNormZRY() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<CoalCuttingNormZRYOutputType | null>(null)
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: coalcuttingnormzrys = [] } = useQuery({
    queryKey: ['coalcuttingnormzrys'],
    queryFn: async () => api.get('/coalcuttingnormzrys').then(res => res.data.data)
  })

  const handleToggleExpand = (cuttingnorm: CoalCuttingNormZRYOutputType) => {
    const id = cuttingnorm?._id;
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
  };
  const createMutation = useMutation({
    mutationFn: (newCuttingNorm: Partial<CoalCuttingNormZRYInputType>) =>
      api.post('/coalcuttingnormzrys', newCuttingNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coalcuttingnormzrys'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updateCuttingNorm: Partial<CoalCuttingNormZRYInputType>) =>
      api.put(`/coalcuttingnormzrys/${updateCuttingNorm._id}`, updateCuttingNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coalcuttingnormzrys'] });
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
      api.delete(`/coalcuttingnormzrys/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coalcuttingnormzrys'] });
      showSuccessAlert('Xóa thành công')
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleSubmit = (values: Partial<CoalCuttingNormZRYInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (CuttingNorm?: CoalCuttingNormZRYOutputType) => {
    if (CuttingNorm) {
      setSelected(CuttingNorm)
    } else {
      setSelected(null)
    }
    setOpen(true)
  }



  return (
    <Paper elevation={3} style={{ padding: 16 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Định mức khấu than - ZRY</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới định mức khấu than - ZRY</Button>
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
            {coalcuttingnormzrys.map((cuttingnorm: CoalCuttingNormZRYOutputType) => (
              <React.Fragment>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>{cuttingnorm.code}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>
                    <IconButton onClick={() => handleToggleExpand(cuttingnorm)}>
                      <Visibility color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => handleOpen(cuttingnorm)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(cuttingnorm._id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {expandedRow === cuttingnorm._id && (<TableRow>
                  <TableCell colSpan={3} sx={{ border: '1px solid black', backgroundColor: '#D3D3D3' }}>
                    < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid grey', fontWeight: 'bold' }}>STT</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid grey', fontWeight: 'bold' }}>Mã khoán</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid grey', fontWeight: 'bold' }}>Thành phần hao phí</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid grey', fontWeight: 'bold' }}>ĐVT</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold' }}>{cuttingnorm.thickness?.name || ''}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold' }}>{cuttingnorm.length?.name || ''}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>{cuttingnorm.code}</TableCell>
                          </TableRow>
                          {cuttingnorm.norms.map((item: any, index: number) => (
                            <TableRow>
                              <TableCell align='center' sx={{ border: '1px solid grey' }}>{index + 1}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid grey' }}>{item.assignmentCode?.code}</TableCell>
                              <TableCell sx={{ border: '1px solid grey' }}>{item.assignmentCode?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid grey' }}>{item.assignmentCode?.uom?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid grey' }}>{item.norm ? item.norm.toLocaleString() : ''}</TableCell>
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
      <CoalCuttingNormZRYModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Paper >
  );
}
