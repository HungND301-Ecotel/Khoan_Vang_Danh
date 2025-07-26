import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import HardnessModal from '../../components/HardnessModal/HardnessModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HardnessType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Hardness() {
    const [open, setOpen] = useState(false)
    const [selectedHardness, setSelectedHardness] = useState<HardnessType | null>(null)

    const queryClient = useQueryClient()
    const { data: hardness = [] } = useQuery({
        queryKey: ['hardness'],
        queryFn: () => api.get('/hardness').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newHardness: Partial<HardnessType>) =>
            api.post('/hardness', newHardness).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardness'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateHardness: Partial<HardnessType>) =>
            api.put(`/hardness/${updateHardness._id}`, updateHardness).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardness'] });
            setOpen(false)
            setSelectedHardness(null)
            showSuccessAlert('Sửa thành công')
        },
        onError: (error: any) => {
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
            api.delete(`/hardness/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardness'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<HardnessType>) => {
        if (selectedHardness) {
            updateMutation.mutate({ ...values, _id: selectedHardness._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (Hardness?: HardnessType) => {
        if (Hardness) {
            setSelectedHardness(Hardness)
        } else {
            setSelectedHardness(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Độ cứng của than/ đá (f)</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Độ cứng</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {hardness.map((item: HardnessType) => (
                            <TableRow key={item._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{item.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
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
            <HardnessModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedHardness={selectedHardness} />
        </Paper>
    )
}
