import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import ExcavationTechModal from '../../components/ExcavationTechModal/ExcavationTechModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExcavationTechType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function ExcavationTech() {
    const [open, setOpen] = useState(false)
    const [selectedExcavationTech, setSelectedExcavationTech] = useState<ExcavationTechType | null>(null)

    const queryClient = useQueryClient()
    const { data: excavationtechs = [] } = useQuery({
        queryKey: ['excavationtechs'],
        queryFn: () => api.get('/excavationtechs').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newExcavationTech: Partial<ExcavationTechType>) =>
            api.post('/excavationtechs', newExcavationTech).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['excavationtechs'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateExcavationTech: Partial<ExcavationTechType>) =>
            api.put(`/excavationtechs/${updateExcavationTech._id}`, updateExcavationTech).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['excavationtechs'] });
            setOpen(false)
            setSelectedExcavationTech(null)
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
            api.delete(`/excavationtechs/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['excavationtechs'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<ExcavationTechType>) => {
        if (selectedExcavationTech) {
            updateMutation.mutate({ ...values, _id: selectedExcavationTech._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (ExcavationTech?: ExcavationTechType) => {
        if (ExcavationTech) {
            setSelectedExcavationTech(ExcavationTech)
        } else {
            setSelectedExcavationTech(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Công nghệ xúc</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới công nghệ xúc</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Công nghệ xúc</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {excavationtechs.map((ExcavationTech: ExcavationTechType) => (
                            <TableRow key={ExcavationTech._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{ExcavationTech.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(ExcavationTech)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(ExcavationTech._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <ExcavationTechModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedExcavationTech={selectedExcavationTech} />
        </Paper>
    )
}
