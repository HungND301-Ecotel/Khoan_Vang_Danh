import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import PhaseGroupModal from '../../components/PhaseGroupModal/PhaseGroupModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PhaseGroupType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function PhaseGroup() {
    const [open, setOpen] = useState(false)
    const [selectedPhaseGroup, setSelectedPhaseGroup] = useState<PhaseGroupType | null>(null)

    const queryClient = useQueryClient()
    const { data: phasegroups = [] } = useQuery({
        queryKey: ['phasegroups'],
        queryFn: () => api.get('/phasegroups').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newPhaseGroup: Partial<PhaseGroupType>) =>
            api.post('/phasegroups', newPhaseGroup).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phasegroups'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updatePhaseGroup: Partial<PhaseGroupType>) =>
            api.put(`/phasegroups/${updatePhaseGroup._id}`, updatePhaseGroup).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phasegroups'] });
            setOpen(false)
            setSelectedPhaseGroup(null)
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
            api.delete(`/phasegroups/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phasegroups'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<PhaseGroupType>) => {
        if (selectedPhaseGroup) {
            updateMutation.mutate({ ...values, _id: selectedPhaseGroup._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (phaseGroup?: PhaseGroupType) => {
        if (phaseGroup) {
            setSelectedPhaseGroup(phaseGroup)
        } else {
            setSelectedPhaseGroup(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Nhóm công đoạn</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Mã nhóm công đoạn</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Tên nhóm công đoạn</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {phasegroups.map((phaseGroup: PhaseGroupType) => (
                            <TableRow key={phaseGroup._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{phaseGroup.code}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>{phaseGroup.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(phaseGroup)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(phaseGroup._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <PhaseGroupModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedPhaseGroup={selectedPhaseGroup} />
        </Paper>
    )
}
