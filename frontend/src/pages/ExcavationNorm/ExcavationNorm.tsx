import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AssignmentNormInputType, AssignmentNormOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import ExcavationNormModal from '../../components/ExcavationNormModal/ExcavationNormModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


export default function ExcavationNorm() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssignmentNormOutputType | null>(null)
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: assignmentnorms = [] } = useQuery({
    queryKey: ['assignmentnorms'],
    queryFn: async () => api.get('/assignmentnorms').then(res => res.data.data)
  })

  const handleToggleExpand = (axcavationnorm: AssignmentNormOutputType) => {
    const id = axcavationnorm?._id;
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
  };
  const createMutation = useMutation({
    mutationFn: (newExcavationNorm: Partial<AssignmentNormInputType>) =>
      api.post('/assignmentnorms', newExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignmentnorms'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updateExcavationNorm: Partial<AssignmentNormInputType>) =>
      api.put(`/assignmentnorms/${updateExcavationNorm._id}`, updateExcavationNorm).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignmentnorms'] });
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
      api.delete(`/assignmentnorms/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignmentnorms'] });
      showSuccessAlert('Xóa thành công')
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleSubmit = (values: Partial<AssignmentNormInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (excavationNorm?: AssignmentNormOutputType) => {
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
        <Typography variant="h4">Định mức đào lò</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới định mức đào lò</Button>
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
            {assignmentnorms.filter((i: AssignmentNormOutputType) => i.type === "excavation").map((axcavationnorm: AssignmentNormOutputType) => (
              <React.Fragment>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>{axcavationnorm.code}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>
                    <IconButton onClick={() => handleToggleExpand(axcavationnorm)}>
                      <Visibility color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => handleOpen(axcavationnorm)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(axcavationnorm._id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {expandedRow === axcavationnorm._id && (<TableRow>
                  <TableCell colSpan={3} sx={{ border: '1px solid black', backgroundColor: '#D3D3D3' }}>
                    < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>STT</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Mã giao khoán</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Tên vật tư, tài sản</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>ĐVT</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>Định mức {axcavationnorm.phase?.name} {axcavationnorm.hardness?.name} ({axcavationnorm.excavationTech?.name})</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{axcavationnorm.phaseGroup?.name} {axcavationnorm.step?.name}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell align='center' colSpan={5} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{axcavationnorm.code}</TableCell>
                          </TableRow>
                          {axcavationnorm.norms.map((item: any, index: number) => (
                            <TableRow>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{index + 1}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.assignmentCode?.code}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.assignmentCode?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.assignmentCode?.uom?.name}</TableCell>
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
      <ExcavationNormModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Paper >
  );
}
