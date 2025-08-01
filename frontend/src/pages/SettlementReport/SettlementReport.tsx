import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Container, Box, MenuItem, Grid, Button, Typography, IconButton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { AdjustmentNormInputType, AdjustmentNormOutputType, PhaseOutputType } from '../../types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import AdjustmentNormCMModal from '../../components/AdjustmentNormCMModal/AdjustmentNormCMModal';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';



export default function Setttlementreport() {
  const queryClient = useQueryClient()
  const { data: phases = [] } = useQuery({
    queryKey: ['phases'],
    queryFn: () => api.get('/phases').then(res => res.data.data)
  })
  return (
    <Paper elevation={3} style={{ padding: 16, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quyết toán giao khoán</Typography>
      </Box>
      <Box mb={3} display={'flex'} gap={3}>
        <TextField
          fullWidth
          type="date"
          placeholder='Từ ngày' />
        <TextField
          fullWidth
          type="date"
          placeholder='Đến ngày' />
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
      </Box>
      < TableContainer component={Paper} sx={{ backgroundColor: '#D3D3D3', width: '100%' }}>
        <Table sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 100 }}>TT</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Mã vật tư</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Mã thiết bị</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Mã giao khoán</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Tên vật tư, tài sản</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 200 }}>ĐVT</TableCell>
              <TableCell align='center' rowSpan={4} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Đơn giá khoán</TableCell>
              <TableCell align='center' colSpan={13} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 900 }}>Quyết toán giao khoán tháng 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' colSpan={13} sx={{ border: '1px solid black', fontWeight: 'bold' }}>Khấu ngang nghiêng</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 100 }}>ĐM gốc</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 600 }}>HS điều chỉnh ĐM</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Định mức</TableCell>
              <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Số lương kế hoạch</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Giá trị kế hoạch</TableCell>
              <TableCell align='center' colSpan={3} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Số lượng thực hiện</TableCell>
              <TableCell align='center' rowSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Giá trị thực hiện</TableCell>
              <TableCell align='center' colSpan={2} sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>So sánh lãi(+);lỗ(-)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Tổng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Trong khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Ngoài khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Tổng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Trong khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Ngoài khoán</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Số lượng</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', minWidth: 300 }}>Giá trị</TableCell>
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
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>KT</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>KT10</TableCell>
              <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Gỗ chèn Ф8-12, L=2,2-2,4m</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>m3</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold', color: 'blue' }}>1.054.664</TableCell>
              {Array.from({ length: 13 }).map((_, index) => (
                <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>GL01158VNMM</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Gỗ Bạch đàn, keo chèn lò Φ8-:-12 cm, L=2,2m</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>m3</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              {Array.from({ length: 13 }).map((_, index) => (
                <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>GL01205VNMM</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Gỗ Keo chèn lò Φ8-:-12cm L=2,2 m</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}>m3</TableCell>
              <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              {Array.from({ length: 13 }).map((_, index) => (
                <TableCell align='center' sx={{ border: '1px solid black', fontWeight: 'bold' }}></TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper >
  );
}
