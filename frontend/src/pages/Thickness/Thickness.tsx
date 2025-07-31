import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import ThicknessModal from '../../components/ThicknessModal/ThicknessModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ThicknessType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Thickness() {
    const [open, setOpen] = useState(false)
    const [selectedThickness, setSelectedThickness] = useState<ThicknessType | null>(null)

    const queryClient = useQueryClient()
    const { data: thickness = [] } = useQuery({
        queryKey: ['thickness'],
        queryFn: () => api.get('/thickness').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newThickness: Partial<ThicknessType>) =>
            api.post('/thickness', newThickness).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thickness'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateThickness: Partial<ThicknessType>) =>
            api.put(`/thickness/${updateThickness._id}`, updateThickness).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thickness'] });
            setOpen(false)
            setSelectedThickness(null)
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
            api.delete(`/thickness/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thickness'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<ThicknessType>) => {
        if (selectedThickness) {
            updateMutation.mutate({ ...values, _id: selectedThickness._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (Thickness?: ThicknessType) => {
        if (Thickness) {
            setSelectedThickness(Thickness)
        } else {
            setSelectedThickness(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Độ dày vỉa</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới độ dày vỉa</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Độ dày vỉa</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {thickness.map((item: ThicknessType) => (
                            <TableRow key={item._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{item.name}</TableCell>
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
            <ThicknessModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedThickness={selectedThickness} />
        </Paper>
    )
}
