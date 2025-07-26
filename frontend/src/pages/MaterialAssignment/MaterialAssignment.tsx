import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import MaterialAssignmentModal from '../../components/MaterialAssignmentModal/MaterialAssignment'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialAssignmentInputType, MaterialAssignmentOutputType, Materials } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function MaterialAssignment() {
    const [open, setOpen] = useState(false)
    const [selectedMaterialAssignment, setSelectedMaterialAssignment] = useState<Materials | null>(null)

    const queryClient = useQueryClient()
    const { data: materialAssignments = [] } = useQuery({
        queryKey: ['materialAssignments'],
        queryFn: () => api.get('/materialassignments').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
            api.post('/materialassignments', newMaterialAssignment).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materialAssignments'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateMaterialAssignment: Partial<MaterialAssignmentInputType>) =>
            api.put(`/materialassignments/${updateMaterialAssignment._id}`, updateMaterialAssignment).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materialAssignments'] });
            setOpen(false)
            setSelectedMaterialAssignment(null)
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
            api.delete(`/materialassignments/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materialAssignments'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<MaterialAssignmentInputType>) => {
        if (selectedMaterialAssignment) {
            updateMutation.mutate({ ...values, _id: selectedMaterialAssignment._id });
        } else {
            createMutation.mutate(values);
        }
    };

    const handleOpen = (MaterialAssignment?: Materials) => {
        if (MaterialAssignment) {
            setSelectedMaterialAssignment(MaterialAssignment)
        } else {
            setSelectedMaterialAssignment(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Vật tư, tài sản</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Thêm mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ border: '1px solid grey' }}>Mã vật tư</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Tên vật tư</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Đơn vị tính</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Mã giao khoán</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Số lượng</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Đơn giá</TableCell>
                            <TableCell sx={{ border: '1px solid grey' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materialAssignments.map((materialAssignment: MaterialAssignmentOutputType) => (
                            <>
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ border: '1px solid grey', fontWeight: 600 }}>{materialAssignment.code}</TableCell>
                                </TableRow>
                                {materialAssignment.materials.map((item: Materials) => (
                                    <TableRow key={item._id}>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item.code}</TableCell>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item.name}</TableCell>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item.uom?.name}</TableCell>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item?.assignmentCode?.code}</TableCell>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item?.quantity}</TableCell>
                                        <TableCell sx={{ border: '1px solid grey' }}>{item?.currentPrice ? item?.currentPrice.toLocaleString() : ''}</TableCell>
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
                            </>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <MaterialAssignmentModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedMaterialAssignment={selectedMaterialAssignment} />
        </Paper>
    )
}
