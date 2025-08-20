import React, { Fragment, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AdjustmentNormInputType, AdjustmentNormOutputType, MaterialAssignmentOutputType, MaterialBudgetInputType, PhaseOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import AdjustmentNormCMModal from '../../components/AdjustmentNormCMModal/AdjustmentNormCMModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';



export default function Setttlementreport() {
  const [selectedMonth, setSelectedMonth] = useState<Number>()
  const [selectedmaterialBudget, setSelectedmaterialBudget] = useState('')
  const [data, setData] = useState<any | null>(null)




  const queryClient = useQueryClient()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const years = []

  for (let i = 0; i < 20; i++) {
    years.push(currentYear - i)
  }

  const { data: phases = [] } = useQuery({
    queryKey: ['phases'],
    queryFn: () => api.get('/phases').then(res => res.data.data)
  })
  const { data: materialassignments = [] } = useQuery({
    queryKey: ['materialassignments', selectedMonth, selectedYear],
    queryFn: () => api.get(`/materialassignments/getFilter?month=${selectedMonth}&year=${selectedYear}`).then(res => res.data.data),
    enabled: !!selectedMonth && !!selectedYear
  })

  const { data: materialbudgets = [] } = useQuery({
    queryKey: ['materialbudgets'],
    queryFn: () => api.get('/materialbudgets').then(res => res.data.data)
  })
  const { data: materialbudget = null } = useQuery({
    queryKey: ['materialbudgets', selectedmaterialBudget],
    queryFn: () => api.get(`/materialbudgets/getOne/${selectedmaterialBudget}`).then(res => setData(res.data.data)),
    enabled: !!selectedmaterialBudget
  })

  return (
    <Paper elevation={3} style={{ padding: 16, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quyết toán giao khoán</Typography>
      </Box>
      <Box mb={3} gap={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              select
              label="Chọn năm"
              value={selectedYear}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                },
              }}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((item, index) => (
                <MenuItem key={index} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              select
              label="Chọn tháng"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                },
              }}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <MenuItem key={index} value={index + 1}>{index + 1}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth select
              label="Chọn công đoạn"
              variant="outlined"
            >
              {
                phases?.map((item: PhaseOutputType) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name}
                  </MenuItem>
                ))
              }
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth select
              label="Chọn chi phí vật tư theo kế hoạch"
              variant="outlined"
              onChange={(e) => setSelectedmaterialBudget(e.target.value)}
            >
              {
                materialbudgets?.map((item: MaterialBudgetInputType) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.code}
                  </MenuItem>
                ))
              }
            </TextField>
          </Grid>
        </Grid>
      </Box>
      < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3', width: '100%' }}>
        <Table sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 100 }}>TT</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 150 }}>Mã vật tư</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 150 }}>Mã thiết bị</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 150 }}>Mã giao khoán</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Tên vật tư, tài sản</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 100 }}>ĐVT</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Đơn giá khoán</TableCell>
              <TableCell align='center' colSpan={13} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 600 }}>Quyết toán giao khoán</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' colSpan={13} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 600 }}>Khấu ngang nghiêng</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 150 }}>ĐM gốc</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>HS điều chỉnh ĐM</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Định mức</TableCell>
              <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Số lương kế hoạch</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Giá trị kế hoạch</TableCell>
              <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Số lượng thực hiện</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Giá trị thực hiện</TableCell>
              <TableCell align='center' colSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>So sánh lãi(+);lỗ(-)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{data?.materialbudget?.assignmentNormCode?.code}</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Tổng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Trong khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Ngoài khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Tổng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Trong khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Ngoài khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Số lượng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>Giá trị</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Chỉ tiêu hiện vật' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Than nguyên khai' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Mét lò đào' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Mét lò xén' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Tỉ lệ đá lẫn trong gương (Ckep)' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Các chỉ tiêu vật tư' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Vật tư có định mức' : ''}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 20 }).map((_, index) => (
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{index === 4 ? 'Vật tư chủ yếu' : ''}</TableCell>
              ))}
            </TableRow>
            {materialassignments.map((material: MaterialAssignmentOutputType) => (
              <Fragment key={material._id}>
                <TableRow>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>{material.device}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>{material.code}</TableCell>
                  <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{material.name}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{material.uom}</TableCell>
                  <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>{material.price ? material.price.toLocaleString() : ''}</TableCell>
                  {Array.from({ length: 13 }).map((_, index) => (
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                      {index === 0 ? data?.assignments.find((i: any) => i._id.toString() === material._id?.toString())?.assignmentNorm
                        : index === 1 ? data?.assignments.find((i: any) => i._id.toString() === material._id?.toString())?.adjustmentNorm
                          : index === 2 ? data?.assignments.find((i: any) => i._id.toString() === material._id?.toString())?.totalNorm : ''}
                    </TableCell>
                  ))}
                </TableRow>
                {material.materials.map((m) => (
                  <TableRow>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{m.code}</TableCell>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{m.name}</TableCell>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>{m.uom?.name}</TableCell>
                    <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                    {Array.from({ length: 13 }).map((_, index) => (
                      <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper >
  );
}
