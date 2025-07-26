import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import CurbSlopeModal from '../../components/CurbSlopeModal/CurbSlopeModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CurbSlopeType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function CurbSlope() {
    const [open, setOpen] = useState(false)
    const [selectedCurbSlope, setSelectedCurbSlope] = useState<CurbSlopeType | null>(null)

    const queryClient = useQueryClient()
    const { data: curbslopes = [] } = useQuery({
        queryKey: ['curbslopes'],
        queryFn: () => api.get('/curbslopes').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newCurbSlope: Partial<CurbSlopeType>) =>
            api.post('/curbslopes', newCurbSlope).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curbslopes'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateCurbSlope: Partial<CurbSlopeType>) =>
            api.put(`/curbslopes/${updateCurbSlope._id}`, updateCurbSlope).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curbslopes'] });
            setOpen(false)
            setSelectedCurbSlope(null)
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
            api.delete(`/curbslopes/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curbslopes'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<CurbSlopeType>) => {
        if (selectedCurbSlope) {
            updateMutation.mutate({ ...values, _id: selectedCurbSlope._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (CurbSlope?: CurbSlopeType) => {
        if (CurbSlope) {
            setSelectedCurbSlope(CurbSlope)
        } else {
            setSelectedCurbSlope(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Độ dốc vỉa</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Độ dốc vỉa</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {curbslopes.map((curbslope: CurbSlopeType) => (
                            <TableRow key={curbslope._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{curbslope.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(curbslope)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(curbslope._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <CurbSlopeModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedCurbSlope={selectedCurbSlope} />
        </Paper>
    )
}
