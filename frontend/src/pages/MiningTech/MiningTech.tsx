import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import MiningTechModal from '../../components/MiningTechModal/MiningTechModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MiningtechType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function MiningTech() {
    const [open, setOpen] = useState(false)
    const [selectedMiningTech, setSelectedMiningTech] = useState<MiningtechType | null>(null)

    const queryClient = useQueryClient()
    const { data: miningtechs = [] } = useQuery({
        queryKey: ['miningtechs'],
        queryFn: () => api.get('/miningtechs').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newMiningTech: Partial<MiningtechType>) =>
            api.post('/miningtechs', newMiningTech).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['miningtechs'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateMiningTech: Partial<MiningtechType>) =>
            api.put(`/miningtechs/${updateMiningTech._id}`, updateMiningTech).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['miningtechs'] });
            setOpen(false)
            setSelectedMiningTech(null)
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
            api.delete(`/miningtechs/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['miningtechs'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<MiningtechType>) => {
        if (selectedMiningTech) {
            updateMutation.mutate({ ...values, _id: selectedMiningTech._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (MiningTech?: MiningtechType) => {
        if (MiningTech) {
            setSelectedMiningTech(MiningTech)
        } else {
            setSelectedMiningTech(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Công nghệ khai thác</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Mã công nghệ khai thác</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Tên công nghệ khai thác</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {miningtechs.map((miningtech: MiningtechType) => (
                            <TableRow key={miningtech._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{miningtech.code}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>{miningtech.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(miningtech)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(miningtech._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <MiningTechModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedMiningTech={selectedMiningTech} />
        </Paper>
    )
}
