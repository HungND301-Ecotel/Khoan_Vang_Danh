import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AssignmentNormInputType, MaterialCostUsedInputType, MaterialCostUsedOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import MaterialCostUsedModal from '../../components/MaterialCostUsedModal/MaterialCostUsedModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';


export default function MaterialCostUsed() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<MaterialCostUsedOutputType | null>(null)
  const [open, setOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: materialcostuseds = [] } = useQuery({
    queryKey: ['materialcostuseds'],
    queryFn: async () => api.get('/materialcostuseds').then(res => res.data.data)
  })

  const handleToggleExpand = (materialcostused: MaterialCostUsedOutputType) => {
    const id = materialcostused?._id;
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
  };
  const createMutation = useMutation({
    mutationFn: (newmaterialCostUsed: Partial<AssignmentNormInputType>) =>
      api.post('/materialcostuseds', newmaterialCostUsed).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialcostuseds'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updatematerialCostUsed: Partial<AssignmentNormInputType>) =>
      api.put(`/materialcostuseds/${updatematerialCostUsed._id}`, updatematerialCostUsed).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialcostuseds'] });
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
      api.delete(`/materialcostuseds/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialcostuseds'] });
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
  const handleOpen = (materialCostUsed?: MaterialCostUsedOutputType) => {
    if (materialCostUsed) {
      setSelected(materialCostUsed)
    } else {
      setSelected(null)
    }
    setOpen(true)
  }



  return (
    <Paper elevation={3} style={{ padding: 16 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Chi phí vật tư thực hiện (Zth)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới chi phí vật tư thực hiện (Zth)</Button>
      </Box>
      < TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Mã chi phí thức hiện (Zth)</b></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Thao tác</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materialcostuseds.map((materialcostused: MaterialCostUsedOutputType) => (
              <React.Fragment>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>{materialcostused.code}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>
                    <IconButton onClick={() => handleToggleExpand(materialcostused)}>
                      <Visibility color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => handleOpen(materialcostused)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(materialcostused._id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {expandedRow === materialcostused._id && (<TableRow>
                  <TableCell colSpan={3} sx={{ border: '1px solid black', backgroundColor: '#D3D3D3' }}>
                    < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>STT</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Mã vật tư</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Tên vật tư, tài sản</TableCell>
                            <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold' }}>ĐVT</TableCell>
                            <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{materialcostused.code}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{materialcostused.productionScope?.name}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {materialcostused.productionScope?.phases.map((item) => (
                            <TableRow key={item.phase?._id}>
                              <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                              <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{item.phase?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{item.phase?.name.toLowerCase() === "khấu than".toLowerCase() ? 'Tấn' : 'Mét'}</TableCell>
                              <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{item.production ? item.production.toLocaleString() : ''}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                            <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Vật tư khai thác</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>Số lượng</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>Đơn giá</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>Chi phí</TableCell>
                          </TableRow>
                          {materialcostused.materials.map((item: any, index: number) => (
                            <TableRow>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{index + 1}</TableCell>
                              <TableCell sx={{ border: '1px solid black' }}>{item.material?.code}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.material?.name}</TableCell>
                              <TableCell sx={{ border: '1px solid black' }}>{item.material?.uom?.name}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.quantity ? item.quantity.toLocaleString() : ''}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item.material?.currentPrice ? item.material?.currentPrice.toLocaleString() : ''}</TableCell>
                              <TableCell align='center' sx={{ border: '1px solid black' }}>{item?.cost ? item?.cost.toLocaleString() : ''}</TableCell>
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
      <MaterialCostUsedModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Paper >
  );
}
