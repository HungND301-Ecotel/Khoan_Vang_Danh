import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import api from '../../config/api.config'
import { AssignmentCodeInputType, MaterialAssignmentInputType, MaterialAssignmentOutputType, MaterialBudgetInputType, Materials } from '../../types'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'
import { Add, Delete, Edit, Visibility } from '@mui/icons-material'
import MaterialBudgetModal from '../../components/MaterialBudgetModal/MaterialBudgetModal'

export default function MaterialBudget() {
  const queryClient = useQueryClient()
  const [data, setData] = useState<any | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<MaterialBudgetInputType | null>(null);
  const [open, setOpen] = useState(false);

  const handleToggleExpand = (id?: string) => {
    if (!id) return;

    setExpandedRow(prev => (prev === id ? null : id));
    getOneMutation.mutate(id)
  };

  const { data: materialbudgets = [] } = useQuery({
    queryKey: ['materialbudgets'],
    queryFn: () => api.get('/materialbudgets').then(res => res.data.data)
  })


  const createMutation = useMutation({
    mutationFn: (newmaterialBudget: Partial<MaterialBudgetInputType>) =>
      api.post('/materialbudgets', newmaterialBudget).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialbudgets'] });
      setOpen(false)
      showSuccessAlert("Thêm mới thành công")
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const updateMutation = useMutation({
    mutationFn: (updatematerialBudget: Partial<MaterialBudgetInputType>) =>
      api.put(`/materialbudgets/${updatematerialBudget._id}`, updatematerialBudget).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialbudgets'] });
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
      api.delete(`/materialbudgets/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialbudgets'] });
      showSuccessAlert('Xóa thành công')
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });
  const handleSubmit = (values: Partial<MaterialBudgetInputType>) => {
    if (selected) {
      updateMutation.mutate({ ...values, _id: selected._id });
    } else {
      createMutation.mutate(values);
    }
  };
  const handleOpen = (materialBudget?: MaterialBudgetInputType) => {
    if (materialBudget) {
      setSelected(materialBudget)
    } else {
      setSelected(null)
    }
    setOpen(true)
  }

  const getOneMutation = useMutation({
    mutationFn: (id: string) =>
      api.get(`/materialbudgets/getOne/${id}`).then(res => res.data.data),
    onSuccess: (data) => {
      setData(data)
    },
    onError: (error: any) => {
      console.log(error.response.data.message || error.response || 'Lỗi')
      showErrorAlert(error.response.data.message || error.response || 'Lỗi')
    }
  });


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Chi phí vật tư kế hoạch (Zth)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Tạo mới chi phí vật tư kế hoạch (Zth)</Button>
      </Box>
      < TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Mã định mức</b></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: 18 }}><b>Thao tác</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materialbudgets.map((materialbudget: MaterialBudgetInputType) => (
              <React.Fragment>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>{materialbudget.code}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black' }}>
                    <IconButton onClick={() => handleToggleExpand(materialbudget._id)}>
                      <Visibility color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => handleOpen(materialbudget)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(materialbudget._id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {expandedRow === materialbudget._id && (<TableCell colSpan={3} sx={{ border: '1px solid black', backgroundColor: '#D3D3D3' }}>
                    < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell colSpan={12} sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Công đoạn: {data?.materialbudget?.phase?.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={12} sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Mã định mức giao khoán: {data?.materialbudget?.code}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={12} sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Sản lượng: {data?.materialbudget?.production} ({data?.phaseGroup?.name.toLowerCase() === "khấu than".toLowerCase() ? 'tấn' : 'mét'})</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Mã vật tư</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Mã giao khoán</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Tên vật tư, tài sản</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>ĐVT</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Định mức gốc</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Hệ số điều chỉnh định mức</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Định mức</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18, width: 150 }}>Số lượng</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18, width: 200 }}>Đơn giá bình quân năm</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18, width: 200 }}>Chi phí kế hoạch</TableCell>
                            <TableCell align='center' sx={{ border: "1px solid grey", fontWeight: 'bold', fontSize: 18 }}>Ghi chú</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data?.assignments.map((assignment: any) => (
                            <>
                              <TableRow>
                                <TableCell sx={{ border: "1px solid grey", color: "blue" }}></TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", color: "blue" }}>{assignment.code}</TableCell>
                                <TableCell sx={{ border: "1px solid grey", color: "blue" }}>{assignment.name}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", color: "blue" }}>{assignment.uom}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}>{assignment.assignmentNorm ? assignment.assignmentNorm.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}>{assignment.adjustmentNorm ? assignment.adjustmentNorm.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}>{assignment.totalNorm ? assignment.totalNorm.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}>{assignment.quantity ? assignment.quantity.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", color: "blue" }}>
                                  {assignment.price ? assignment.price.toLocaleString() : ''}
                                </TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}>{assignment.cost ? assignment.cost.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: "1px solid grey", }}></TableCell>
                              </TableRow>
                              {assignment.materials.map((material: Materials) => (
                                <TableRow>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}>{material.code}</TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}></TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}>{material.name}</TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}>{material.uom?.name}</TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}></TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}></TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}></TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}>
                                    {/* {material.quantity ? material.quantity.toLocaleString() : ''} */}
                                  </TableCell>
                                  <TableCell align='center' sx={{ border: "1px solid grey", }}>
                                    {material.currentPrice ? material.currentPrice.toLocaleString() : ''}
                                  </TableCell>
                                  <TableCell sx={{ border: "1px solid grey", }}></TableCell>
                                  <TableCell sx={{ border: "1px solid grey" }}></TableCell>
                                </TableRow>
                              ))}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TableCell>)}
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MaterialBudgetModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selected={selected} />
    </Box>
  )
}
