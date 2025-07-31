import { Add, Delete, Edit } from '@mui/icons-material'
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import AssignmentCodeModal from '../../components/AssignmentCodeModal/AssignmentCodeModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AssignmentCodeInputType, AssignmentCodeOutputType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'

export default function AssignmentCode() {
    const [open, setOpen] = useState(false)
    const [selectedAssignmentCode, setSelectedAssignmentCode] = useState<AssignmentCodeOutputType | null>(null)

    const queryClient = useQueryClient()
    const { data: assignmentcodes = [] } = useQuery({
        queryKey: ['assignmentcodes'],
        queryFn: () => api.get('/assignmentcodes').then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newAssignmentCode: Partial<AssignmentCodeInputType>) =>
            api.post('/assignmentcodes', newAssignmentCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignmentcodes'] });
            setOpen(false)
            showSuccessAlert('Thêm thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
            api.put(`/assignmentcodes/${updateAssignmentCode._id}`, updateAssignmentCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignmentcodes'] });
            setOpen(false)
            setSelectedAssignmentCode(null)
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
            api.delete(`/assignmentcodes/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignmentcodes'] });
            showSuccessAlert('Xóa thành công')
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<AssignmentCodeInputType>) => {
        if (selectedAssignmentCode) {
            updateMutation.mutate({ ...values, _id: selectedAssignmentCode._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (AssignmentCode?: AssignmentCodeOutputType) => {
        if (AssignmentCode) {
            setSelectedAssignmentCode(AssignmentCode)
        } else {
            setSelectedAssignmentCode(null)
        }
        setOpen(true)
    }

    return (
        <Paper elevation={3} style={{ padding: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Mã giao khoán</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Tạo mới mã giao khoán</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Mã thiết bị</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Mã giao khoán</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Tên giao khoán</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>ĐVT</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Đơn giá</TableCell>
                            <TableCell align='center' sx={{ border: '1px solid grey', fontWeight: 'bold', fontSize: 18 }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignmentcodes.map((AssignmentCode: AssignmentCodeOutputType) => (
                            <TableRow key={AssignmentCode._id}>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{AssignmentCode.deviceCode?.code}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{AssignmentCode.code}</TableCell>
                                <TableCell sx={{ border: '1px solid grey' }}>{AssignmentCode.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{AssignmentCode.uom?.name}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>{AssignmentCode.price ? AssignmentCode.price.toLocaleString() : ''}</TableCell>
                                <TableCell align='center' sx={{ border: '1px solid grey' }}>
                                    <IconButton onClick={() => handleOpen(AssignmentCode)}>
                                        <Edit color='primary' />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(AssignmentCode._id)}>
                                        <Delete color='error' />
                                    </IconButton>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <AssignmentCodeModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedAssignmentCode={selectedAssignmentCode} />
        </Paper>
    )
}
