import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import RockRatioModal from '../../components/RockRatioModal/RockRatioModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RockRatioType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function RockRatio() {
    const [open, setOpen] = useState(false)
    const [selectedRockRatio, setSelectedRockRatio] = useState<RockRatioType | null>(null)

    const queryClient = useQueryClient()
    const { data: rockratios = [] } = useQuery({
        queryKey: ['rockratios'],
        queryFn: () => api.get('/rockratios').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newRockRatio: Partial<RockRatioType>) =>
            api.post('/rockratios', newRockRatio).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rockratios'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateRockRatio: Partial<RockRatioType>) =>
            api.put(`/rockratios/${updateRockRatio._id}`, updateRockRatio).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rockratios'] });
            setOpen(false)
            setSelectedRockRatio(null)
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
            api.delete(`/rockratios/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rockratios'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<RockRatioType>) => {
        if (selectedRockRatio) {
            updateMutation.mutate({ ...values, _id: selectedRockRatio._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (RockRatio?: RockRatioType) => {
        if (RockRatio) {
            setSelectedRockRatio(RockRatio)
        } else {
            setSelectedRockRatio(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Tỉ lệ đá lẫn trong gương</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới tỉ lệ</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Tỉ lệ đá lẫn trong gương</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}> Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rockratios.map((RockRatio: RockRatioType) => (
                            <TableRow key={RockRatio._id}>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{RockRatio.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(RockRatio)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(RockRatio._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <RockRatioModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedRockRatio={selectedRockRatio} />
        </Paper>
    )
}
