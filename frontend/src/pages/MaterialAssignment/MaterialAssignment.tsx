import { Add, ArrowDropDown, Delete, Edit, FileDownload, FileUpload, FilterList, Mail, Print, Search } from '@mui/icons-material'
import { Box, Breadcrumbs, Button, Container, IconButton, InputAdornment, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import MaterialAssignmentModal from '../../components/MaterialAssignmentModal/MaterialAssignment'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialAssignmentInputType, Materials } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'
import { TableRowSelection } from 'antd/es/table/interface'
import { TableProps, Table } from 'antd'

export default function MaterialAssignment() {
    const [open, setOpen] = useState(false)
    const [selectedMaterialAssignment, setSelectedMaterialAssignment] = useState<Materials | null>(null)
    const [selectedMaterialAssignments, setSelectedMaterialAssignments] = useState<React.Key[]>([])
    const [searchValue, setSearchValue] = useState('')


    const queryClient = useQueryClient()
    const { data: materialAssignments = [] } = useQuery({
        queryKey: ['materialAssignments'],
        queryFn: () => api.get('/materialassignments/getAll').then(res => res.data.data)
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
    const columns: TableProps<Materials>['columns'] = [
        {
            title: '',
            dataIndex: 'number',
            key: 'number',
            width: 50,
            render: (value, record, index) => (
                <Typography>{index + 1}</Typography>
            )
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Mã giao khoán</Typography>,
            dataIndex: 'assignmentCode',
            key: 'assignmentCode',
            width: 200,
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.assignmentCode?.code}</Typography>
            ),
            sorter: (a, b) =>
                (a.assignmentCode?.code ?? '').localeCompare(b.assignmentCode?.code ?? '', 'vi', { sensitivity: 'base' }),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Mã vật tư</Typography>,
            dataIndex: 'code',
            key: 'code',
            width: 200,
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.code}</Typography>
            ),
            sorter: (a, b) =>
                (a.code ?? '').localeCompare(b.code ?? '', 'vi', { sensitivity: 'base' }),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Tên vật tư</Typography>,
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) =>
                (a.name ?? '').localeCompare(b.name ?? '', 'vi', { sensitivity: 'base' }),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>ĐVT</Typography>,
            dataIndex: 'uom',
            key: 'uom',
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.uom?.name}</Typography>
            ),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Số lượng</Typography>,
            dataIndex: 'quantity',
            key: 'quantity',
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.quantity ? record.quantity.toLocaleString() : ''}</Typography>
            ),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Đơn giá</Typography>,
            dataIndex: 'price',
            key: 'price',
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.currentPrice ? record.currentPrice.toLocaleString() : ''}</Typography>
            ),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Sửa</Typography>,
            dataIndex: 'edit',
            width: 50,
            render: (_, record) => (
                <IconButton onClick={() => handleOpen(record)}>
                    <Edit />
                </IconButton>
            )
        },
    ]

    const rowSelection: TableRowSelection<Materials> = {
        selectedRowKeys: selectedMaterialAssignments,
        onChange: (newSelectedMaterialAssignments: React.Key[]) => {
            setSelectedMaterialAssignments(newSelectedMaterialAssignments);
        },
    };
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Vật tư tài sản</Typography>
            </Breadcrumbs>
            <Box mt={3}>
                <Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" sx={{ color: 'blue' }}>Vật tư tài sản</Typography>
                        <Box display={'flex'} gap={4} mt={2} justifyContent='space-between'>
                            <Box display={'flex'} gap={2}>
                                <Button variant='contained' color='warning' endIcon={<Add />} onClick={() => handleOpen()}>Tạo mới</Button>
                                <Button variant='contained' color='error' endIcon={<Delete />} onClick={() => handleDelete()}>Xóa</Button>
                            </Box>
                            <Box display={'flex'} flex={1} gap={2}>
                                <Button variant='outlined' color='inherit' startIcon={<FilterList />}>Lọc</Button>
                                <TextField fullWidth size='small'
                                    placeholder='Tìm kiếm'
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Search sx={{ fontSize: 24 }} />
                                            </InputAdornment>
                                        )
                                    }} />
                            </Box>
                            <Box display={'flex'} gap={2}>
                                <Button variant='outlined' color='inherit' startIcon={<FileUpload />}>Tải lên</Button>
                                <Button variant='outlined' color='inherit' startIcon={<FileDownload />}>Xuất file</Button>
                                <Button variant='outlined' color='inherit' startIcon={<Print />}>In</Button>
                                <Button variant='outlined' color='inherit' startIcon={<Mail />} endIcon={<ArrowDropDown />}>Gửi</Button>
                            </Box>
                        </Box>
                    </Box>
                    <Table<Materials> rowKey="_id" rowSelection={rowSelection}
                        pagination={{
                            position: ['bottomCenter'],
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            defaultPageSize: 10,
                            showTotal: (total, range) => <div style={{ flex: 1, textAlign: 'left' }}>
                                Hiển thị {range[0]}-{range[1]} trên {total} mục
                            </div>,
                        }} columns={columns} dataSource={materialAssignments} />
                </Box>
            </Box>
            <MaterialAssignmentModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedMaterialAssignment={selectedMaterialAssignment} />
        </Box>
    )
}
