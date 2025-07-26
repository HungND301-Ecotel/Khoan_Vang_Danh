import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import UnitModal from '../../components/UnitModal/UnitModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UnitType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Unit() {
    const [open, setOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null)

    const queryClient = useQueryClient()
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => api.get('/units').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newUnit: Partial<UnitType>) =>
            api.post('/units', newUnit).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateUnit: Partial<UnitType>) =>
            api.put(`/units/${updateUnit._id}`, updateUnit).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setOpen(false)
            setSelectedUnit(null)
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
            api.delete(`/units/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<UnitType>) => {
        if (selectedUnit) {
            updateMutation.mutate({ ...values, _id: selectedUnit._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (Unit?: UnitType) => {
        if (Unit) {
            setSelectedUnit(Unit)
        } else {
            setSelectedUnit(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Đơn vị tính</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Đơn vị tính</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {units.map((Unit: UnitType) => (
                            <TableRow key={Unit._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{Unit.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(Unit)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(Unit._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <UnitModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedUnit={selectedUnit} />
        </Paper>
    )
}
