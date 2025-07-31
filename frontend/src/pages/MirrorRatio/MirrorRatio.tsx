import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import MirrorRatioModal from '../../components/MirrorRatioModal/MirrorRatioModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MirrorRatioType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function MirrorRatio() {
    const [open, setOpen] = useState(false)
    const [selectedMirrorRatio, setSelectedMirrorRatio] = useState<MirrorRatioType | null>(null)

    const queryClient = useQueryClient()
    const { data: mirrorratios = [] } = useQuery({
        queryKey: ['mirrorratios'],
        queryFn: () => api.get('/mirrorratios').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newMirrorRatio: Partial<MirrorRatioType>) =>
            api.post('/mirrorratios', newMirrorRatio).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mirrorratios'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateMirrorRatio: Partial<MirrorRatioType>) =>
            api.put(`/mirrorratios/${updateMirrorRatio._id}`, updateMirrorRatio).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mirrorratios'] });
            setOpen(false)
            setSelectedMirrorRatio(null)
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
            api.delete(`/mirrorratios/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mirrorratios'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<MirrorRatioType>) => {
        if (selectedMirrorRatio) {
            updateMutation.mutate({ ...values, _id: selectedMirrorRatio._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (MirrorRatio?: MirrorRatioType) => {
        if (MirrorRatio) {
            setSelectedMirrorRatio(MirrorRatio)
        } else {
            setSelectedMirrorRatio(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Tỉ lệ gương than mềm</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới tỉ lệ</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Tỉ lệ gương than mềm</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}> Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mirrorratios.map((MirrorRatio: MirrorRatioType) => (
                            <TableRow key={MirrorRatio._id}>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{MirrorRatio.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(MirrorRatio)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(MirrorRatio._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <MirrorRatioModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedMirrorRatio={selectedMirrorRatio} />
        </Paper>
    )
}
