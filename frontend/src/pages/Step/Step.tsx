import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import StepModal from '../../components/StepModal/StepModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StepType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Step() {
    const [open, setOpen] = useState(false)
    const [selectedStep, setSelectedStep] = useState<StepType | null>(null)

    const queryClient = useQueryClient()
    const { data: steps = [] } = useQuery({
        queryKey: ['steps'],
        queryFn: () => api.get('/steps').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newStep: Partial<StepType>) =>
            api.post('/steps', newStep).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['steps'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateStep: Partial<StepType>) =>
            api.put(`/steps/${updateStep._id}`, updateStep).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['steps'] });
            setOpen(false)
            setSelectedStep(null)
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
            api.delete(`/steps/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['steps'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<StepType>) => {
        if (selectedStep) {
            updateMutation.mutate({ ...values, _id: selectedStep._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (Step?: StepType) => {
        if (Step) {
            setSelectedStep(Step)
        } else {
            setSelectedStep(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Loại chống</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Tên loại chống</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}> Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {steps.map((step: StepType) => (
                            <TableRow key={step._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{step.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(step)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(step._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <StepModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedStep={selectedStep} />
        </Paper>
    )
}
