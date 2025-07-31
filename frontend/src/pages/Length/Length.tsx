import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import LengthModal from '../../components/LengthModal/LengthModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LengthType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Length() {
    const [open, setOpen] = useState(false)
    const [selectedLength, setSelectedLength] = useState<LengthType | null>(null)

    const queryClient = useQueryClient()
    const { data: length = [] } = useQuery({
        queryKey: ['length'],
        queryFn: () => api.get('/length').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newLength: Partial<LengthType>) =>
            api.post('/length', newLength).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['length'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateLength: Partial<LengthType>) =>
            api.put(`/length/${updateLength._id}`, updateLength).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['length'] });
            setOpen(false)
            setSelectedLength(null)
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
            api.delete(`/length/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['length'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<LengthType>) => {
        if (selectedLength) {
            updateMutation.mutate({ ...values, _id: selectedLength._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (Length?: LengthType) => {
        if (Length) {
            setSelectedLength(Length)
        } else {
            setSelectedLength(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Chiều dài lò</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới chiều dài lò</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Chiều dài lò</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {length.map((item: LengthType) => (
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
            <LengthModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedLength={selectedLength} />
        </Paper>
    )
}
