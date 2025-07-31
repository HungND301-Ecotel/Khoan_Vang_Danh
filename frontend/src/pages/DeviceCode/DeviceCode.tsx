import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import DeviceCodeModal from '../../components/DeviceCodeModal/DeviceCodeModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DeviceCodeType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function DeviceCode() {
    const [open, setOpen] = useState(false)
    const [selectedDeviceCode, setSelectedDeviceCode] = useState<DeviceCodeType | null>(null)

    const queryClient = useQueryClient()
    const { data: devicecodes = [] } = useQuery({
        queryKey: ['devicecodes'],
        queryFn: () => api.get('/devicecodes').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newDeviceCode: Partial<DeviceCodeType>) =>
            api.post('/devicecodes', newDeviceCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateDeviceCode: Partial<DeviceCodeType>) =>
            api.put(`/devicecodes/${updateDeviceCode._id}`, updateDeviceCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            setOpen(false)
            setSelectedDeviceCode(null)
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
            api.delete(`/devicecodes/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<DeviceCodeType>) => {
        if (selectedDeviceCode) {
            updateMutation.mutate({ ...values, _id: selectedDeviceCode._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (DeviceCode?: DeviceCodeType) => {
        if (DeviceCode) {
            setSelectedDeviceCode(DeviceCode)
        } else {
            setSelectedDeviceCode(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Mã thiết bị</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới mã thiết bị</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Mã thiết bị</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {devicecodes.map((item: DeviceCodeType) => (
                            <TableRow key={item._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{item.code}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(item)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(item._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <DeviceCodeModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedDeviceCode={selectedDeviceCode} />
        </Paper>
    )
}
