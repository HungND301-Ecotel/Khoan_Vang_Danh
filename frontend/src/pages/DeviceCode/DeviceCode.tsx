import { Add, ArrowDropDown, Delete, Edit, FileDownload, FileUpload, FilterList, Mail, Print, Search } from '@mui/icons-material'
import { Box, Breadcrumbs, Button, Container, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import DeviceCodeModal from '../../components/DeviceCodeModal/DeviceCodeModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DeviceCodeType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'
import { Table, TableProps } from 'antd'
import { TableRowSelection } from 'antd/es/table/interface'

export default function DeviceCode() {
    const [open, setOpen] = useState(false)
    const [selectedDeviceCode, setSelectedDeviceCode] = useState<DeviceCodeType | null>(null)
    const [selectedDeviceCodes, setSelectedDeviceCodes] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('')

    const queryClient = useQueryClient()
    const { data: devicecodes = [] } = useQuery({
        queryKey: ['devicecodes', searchValue],
        queryFn: () => api.get(`/devicecodes?q=${searchValue}`).then(res => res.data.data)
    })

    const createMutation = useMutation({
        mutationFn: (newDeviceCode: Partial<DeviceCodeType>) =>
            api.post('/devicecodes', newDeviceCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            setOpen(false)
            showSuccessAlert("Thêm mới thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updateDeviceCode: Partial<DeviceCodeType>) =>
            api.put(`/devicecodes/${updateDeviceCode._id}`, updateDeviceCode).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            setOpen(false)
            setSelectedDeviceCode(null)
            showSuccessAlert("Sửa thành công")
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleDelete = () => {
        if (selectedDeviceCodes.length === 0) {
            showErrorAlert('Không tìm thấy bản ghi');
            return;
        }
        showConfirmAlert(`Bạn có muốn xóa ${selectedDeviceCodes.length} bản ghi? hành động này không thể hoàn tác.`).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(selectedDeviceCodes)
            }
        });
    };
    const deleteMutation = useMutation({
        mutationFn: (ids: React.Key[]) =>
            api.delete(`/devicecodes`, { data: { ids } }).then(res => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ['devicecodes'] });
            setSelectedDeviceCodes([])
            showSuccessAlert(message || 'Xóa thành công')
        },
        onError: (error: any) => {
            console.log(error.response.data.message || error.response || 'Lỗi')
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const handleSubmit = (values: Partial<DeviceCodeType>) => {
        if (selectedDeviceCode) {
            updateMutation.mutate({ ...values, _id: selectedDeviceCode._id });
        } else {
            createMutation.mutate(values);
        }
    };
    const handleOpen = (DeviceCode?: DeviceCodeType) => {
        if (DeviceCode) {
            setSelectedDeviceCode(DeviceCode)
        } else {
            setSelectedDeviceCode(null)
        }
        setOpen(true)
    }

    const columns: TableProps<DeviceCodeType>['columns'] = [
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
            title: <Typography sx={{ fontWeight: 'bold' }}>Mã thiết bị</Typography>,
            dataIndex: 'code',
            key: 'code',
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold' }}>{record.code}</Typography>
            ),
            sorter: (a, b) =>
                (a.code ?? '').localeCompare(b.code ?? '', 'vi', { sensitivity: 'base' }),
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

    const rowSelection: TableRowSelection<DeviceCodeType> = {
        selectedRowKeys: selectedDeviceCodes,
        onChange: (newSelectedDeviceCodes: React.Key[]) => {
            setSelectedDeviceCodes(newSelectedDeviceCodes);
        },
    };

    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Mã thiết bị</Typography>
            </Breadcrumbs>
            <Box mt={3}>
                <Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" sx={{ color: 'blue' }}>Mã thiết bị</Typography>
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
                    <Table<DeviceCodeType> 
                    rowKey="_id" rowSelection={rowSelection}
                        pagination={{   
                            position: ['bottomCenter'],
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            defaultPageSize: 10,
                            showTotal: (total, range) => <div style={{ flex: 1, textAlign: 'left' }}>
                                Hiển thị {range[0]}-{range[1]} trên {total} mục
                            </div>,
                        }} columns={columns} dataSource={devicecodes} />
                </Box>
            </Box>
            <DeviceCodeModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedDeviceCode={selectedDeviceCode} />
        </Box>
    )
}
