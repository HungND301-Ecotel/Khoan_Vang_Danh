import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import PhaseModal from '../../components/PhaseModal/PhaseModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PhaseOutputType, PhaseInputType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function Phase() {
    const [open, setOpen] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<PhaseOutputType | null>(null)

    const queryClient = useQueryClient()
    const { data: phases = [] } = useQuery({
        queryKey: ['phases'],
        queryFn: () => api.get('/phases').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newPhase: Partial<PhaseInputType>) =>
            api.post('/phases', newPhase).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phases'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updatePhase: Partial<PhaseInputType>) =>
            api.put(`/phases/${updatePhase._id}`, updatePhase).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phases'] });
            setOpen(false)
            setSelectedPhase(null)
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
            api.delete(`/phases/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phases'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<PhaseInputType>) => {
        if (selectedPhase) {
            updateMutation.mutate({ ...values, _id: selectedPhase._id });
        } else {
            createMutation.mutate(values);
        }
    };

    const handleOpen = (phase?: PhaseOutputType) => {
        if (phase) {
            setSelectedPhase(phase)
        } else {
            setSelectedPhase(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Công đoạn</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới công đoạn</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18  }}>Mã công đoạn</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18  }}>Tên công đoạn</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18  }}>Nhóm công đoạn</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18  }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {phases.map((phase: PhaseOutputType) => (
                            <TableRow key={phase._id}>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{phase.code}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>{phase.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{phase.phaseGroup?.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(phase)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(phase._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <PhaseModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedPhase={selectedPhase} />
        </Paper>
    )
}
