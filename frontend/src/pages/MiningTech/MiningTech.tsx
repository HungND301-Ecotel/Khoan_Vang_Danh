import { Add, ArrowDropDown, Delete, Edit, FileDownload, FileUpload, FilterList, Mail, Print, Search } from '@mui/icons-material'
import { Box, Breadcrumbs, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import MiningTechModal from '../../components/MiningTechModal/MiningTechModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MiningtechType } from '../../types'
import api from '../../config/api.config'
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert'
import { TableRowSelection } from 'antd/es/table/interface';
import { TableProps, Table } from 'antd';

export default function MiningTech() {
    const [open, setOpen] = useState(false)
    const [selectedMiningTech, setSelectedMiningTech] = useState<MiningtechType | null>(null)
    const [selectedMiningTechs, setSelectedMiningTechs] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('');

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

   
    const handleDeleteMultiple = () => {
        if (selectedMiningTechs.length === 0) {
            showErrorAlert('Vui lòng chọn ít nhất một bản ghi để xóa');
            return;
        }
        
        showConfirmAlert(`Bạn có muốn xóa ${selectedMiningTechs.length} bản ghi đã chọn?`).then((result) => {
            if (result.isConfirmed) {
            
                selectedMiningTechs.forEach(id => {
                    deleteMutation.mutate(id as string);
                });
                
               
                setSelectedMiningTechs([]);
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

    const columns: TableProps<MiningtechType>['columns'] = [
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
            title: <Typography sx={{ fontWeight: 'bold' }}>Mã công nghệ khai thác</Typography>,
            dataIndex: 'code',
            key: 'code',
            render: (_, record) => (
                <Typography sx={{ fontWeight: 'bold', textAlign: 'center' }}>{record.code}</Typography>
            ),
            sorter: (a, b) =>
                (a.code ?? '').localeCompare(b.code ?? '', 'vi', { sensitivity: 'base' }),
        },
        {
            title: <Typography sx={{ fontWeight: 'bold' }}>Tên công nghệ khai thác</Typography>,
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => (
                <Typography>{record.name}</Typography>
            ),
            sorter: (a, b) =>
                (a.name ?? '').localeCompare(b.name ?? '', 'vi', { sensitivity: 'base' }),
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
        // {
        //     title: <Typography sx={{ fontWeight: 'bold' }}>Xóa</Typography>,
        //     dataIndex: 'delete',
        //     width: 50,
        //     render: (_, record) => (
        //         <IconButton onClick={() => handleDelete(record._id)} color="error">
        //             <Delete />
        //         </IconButton>
        //     )
        // },
    ];

    const rowSelection: TableRowSelection<MiningtechType> = {
        selectedRowKeys: selectedMiningTechs,
        onChange: (newSelectedMiningTechs: React.Key[]) => {
            setSelectedMiningTechs(newSelectedMiningTechs);
        },
    };

    return (
        <Box>
             {/* <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Công nghệ khai thác</Typography>
            </Breadcrumbs>  */}
            <Box mt={3}>
                <Box>
                    <Box sx={{ mb: 2 }}>
                         {/* <Typography variant="h4" sx={{ color: 'blue' }}>
                            Công nghệ khai thác
                        </Typography>  */}
                        <Box display={'flex'} gap={4} mt={2} justifyContent='space-between'>
                            <Box display={'flex'} gap={2}>
                                <Button variant='contained' color='warning' endIcon={<Add />} onClick={() => handleOpen()}>
                                    Tạo mới
                                </Button>
                                <Button 
                                    variant='contained' 
                                    color='error' 
                                    endIcon={<Delete />} 
                                    onClick={handleDeleteMultiple}
                                    disabled={selectedMiningTechs.length === 0}
                                >
                                    Xóa ({selectedMiningTechs.length})
                                </Button>
                            </Box>
                            <Box display={'flex'} flex={1} gap={2}>
                                <Button variant='outlined' color='inherit' startIcon={<FilterList />}>
                                    Lọc
                                </Button>
                                <TextField 
                                    fullWidth 
                                    size='small'
                                    placeholder='Tìm kiếm'
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Search sx={{ fontSize: 24 }} />
                                            </InputAdornment>
                                        )
                                    }} 
                                />
                            </Box>
                            <Box display={'flex'} gap={2}>
                                <Button variant='outlined' color='inherit' startIcon={<FileUpload />}>
                                    Tải lên
                                </Button>
                                <Button variant='outlined' color='inherit' startIcon={<FileDownload />}>
                                    Xuất file
                                </Button>
                                <Button variant='outlined' color='inherit' startIcon={<Print />}>
                                    In
                                </Button>
                                <Button variant='outlined' color='inherit' startIcon={<Mail />} endIcon={<ArrowDropDown />}>
                                    Gửi
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                    <Table<MiningtechType> 
                        rowKey="_id" 
                        rowSelection={rowSelection}
                        pagination={{
                            position: ['bottomCenter'],
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            defaultPageSize: 10,
                            showTotal: (total, range) => <div style={{ flex: 1, textAlign: 'left' }}>
                                Hiển thị {range[0]}-{range[1]} trên {total} mục
                            </div>,
                        }} 
                        columns={columns} 
                        dataSource={miningtechs} 
                    />
                </Box>
            </Box>
            <MiningTechModal open={open} setOpen={setOpen} handleSubmit={handleSubmit} selectedMiningTech={selectedMiningTech} />
        </Box>
    )
}