import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import CrossSectionModal from '../../components/CrossSectionModal/CrossSectionModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CrossSectionOutputType, CrossSectionInputType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function CrossSection() {
    const [open, setOpen] = useState(false)
    const [selectedCrossSection, setSelectedCrossSection] = useState<CrossSectionOutputType | null>(null)

    const queryClient = useQueryClient()
    const { data: crosssections = [] } = useQuery({
        queryKey: ['crosssections'],
        queryFn: () => api.get('/crosssections').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newCrossSection: Partial<CrossSectionInputType>) =>
            api.post('/crosssections', newCrossSection).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crosssections'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateCrossSection: Partial<CrossSectionInputType>) =>
            api.put(`/crosssections/${updateCrossSection._id}`, updateCrossSection).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crosssections'] });
            setOpen(false)
            setSelectedCrossSection(null)
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
            api.delete(`/crosssections/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crosssections'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<CrossSectionInputType>) => {
        if (selectedCrossSection) {
            updateMutation.mutate({ ...values, _id: selectedCrossSection._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (CrossSection?: CrossSectionOutputType) => {
        if (CrossSection) {
            setSelectedCrossSection(CrossSection)
        } else {
            setSelectedCrossSection(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Tiết diện lò xén</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Tiết diện lò xén</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Đơn vị tính</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {crosssections.map((item: CrossSectionOutputType) => (
                            <TableRow key={item._id}>
                                <TableCell sx={{ border: '1px solid grey' }}>{item.name}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>{item.uom?.name}</TableCell>
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
            <CrossSectionModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedCrossSection={selectedCrossSection} />
        </Paper>
    )
}
