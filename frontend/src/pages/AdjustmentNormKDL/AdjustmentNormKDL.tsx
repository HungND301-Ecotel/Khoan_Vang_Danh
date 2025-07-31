import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AdjustmentNormKInputType, AdjustmentNormKOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import AdjustmentNormKDLModal from '../../components/AdjustmentNormKDLModal/AdjustmentNormKDLModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


export default function AdjustmentNormKDL() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdjustmentNormKOutputType | null>(null)
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: adjustmentnormks = [] } = useQuery({
    queryKey: ['adjustmentnormks'],
    queryFn: async () => api.get('/adjustmentnormks').then(res => res.data.data)
  })

  const handleToggleExpand = (axcavationnorm: AdjustmentNormKOutputType) => {
    const id = axcavationnorm?._id;
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
  };
  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AdjustmentNormKInputType>) =>
      api.post('/adjustmentnormks', newExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnormks'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<AdjustmentNormKInputType>) =>
      api.put(`/adjustmentnormks/${updateExcavationNorm._id}`, updateExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnormks'] });
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
      api.delete(`/adjustmentnormks/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentnormks'] });
      showSuccessAlert('Xóa thành công')
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleSubmit = (values: Partial<AdjustmentNormKInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (excavationNorm?: AdjustmentNormKOutputType) => {
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
        <Typography variant="h4">Hệ số điều chỉnh định mức CK.ĐL</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới Hệ số điều chỉnh định mức CK.ĐL</Button>
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
            {adjustmentnormks.filter((i: AdjustmentNormKOutputType) => i.type === "KDL").map((adjustmentnorm: AdjustmentNormKOutputType) => (
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
                            <TableCell align='center' colSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Độ cứng của đá lẫn trong gương</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{adjustmentnorm.hardness?.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align='center' colSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Tỉ lệ đã lẫn trong gương (Ckẹp)</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{adjustmentnorm.rockRatio?.name}</TableCell>
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
      <AdjustmentNormKDLModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Paper >
  );
}
