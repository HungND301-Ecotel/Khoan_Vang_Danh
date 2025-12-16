import { CloseRounded, PhotoCamera } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputLabel,
    TextField,
    Typography,
    useTheme
} from '@mui/material'
import { useAtom } from 'jotai'
import React, { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react'
import { userAtom } from '../../atoms/userAtoms'
import { useMutation } from '@tanstack/react-query'
import UserService from '../../service/UserService'
import { showErrorAlert, showSuccessAlert } from '../Alert'

// Giả định kiểu dữ liệu của người dùng, bạn nên định nghĩa nó ở tệp atoms/userAtoms
// interface User {
//   fullName: string;
//   email: string;
//   phone: string;
//   address: string;
//   avatarUrl: string; // Thêm trường này cho ảnh đại diện
// }

export default function Profile({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const [user, setUser] = useAtom(userAtom)
    const theme = useTheme()

    // State cục bộ cho việc chỉnh sửa thông tin
    const [editData, setEditData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        avatarUrl: './logo.png' // Sử dụng avatarUrl từ user hoặc default
    })

    useEffect(() => {
        setEditData({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            avatarUrl: user?.avatarUrl || './logo.png' // Sử dụng avatarUrl từ user hoặc default
        })
    }, [user])


    // Ref cho input file ẩn
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cập nhật state khi giá trị input thay đổi
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value
        })
    }

    // Xử lý khi click vào biểu tượng camera để chọn ảnh
    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    // Xử lý khi chọn tệp ảnh mới
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            // Ở đây, bạn sẽ cần logic để tải ảnh lên server và nhận URL mới.
            // Tạm thời, chúng ta sử dụng URL đối tượng cục bộ để hiển thị ngay lập tức
            const newAvatarUrl = URL.createObjectURL(file)
            setEditData(prev => ({
                ...prev,
                avatarUrl: newAvatarUrl
            }))

            // **LƯU Ý QUAN TRỌNG:**
            // Trong môi trường thực tế, bạn cần gọi API để tải tệp lên server.
            // Ví dụ: uploadFile(file).then(url => setEditData(prev => ({ ...prev, avatarUrl: url })))
        }
    }

    // Xử lý lưu thông tin
    const handleSave = useMutation({
        mutationFn: () => UserService.update(editData, user?._id),
        onSuccess: (data) => {
            setUser(data)
            setOpen(false)
            showSuccessAlert('Cập nhật thành công')
        },
        onError: (err: any) => {
            showErrorAlert(err.response.data.message || 'Cập nhật thất bại')
        }
    })

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Typography variant="h6" component="div">
                    Thông tin tài khoản
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={() => setOpen(false)}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseRounded />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers> {/* Thêm dividers để có đường kẻ phân chia */}
                <Box display="flex" flexDirection={'column'} alignItems={'center'} gap={4}>
                    {/* Phần Avatar và chọn ảnh */}
                    <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                        <Avatar
                            src={editData.avatarUrl}
                            alt={editData.fullName}
                            sx={{ width: 120, height: 120, border: `3px solid ${theme.palette.primary.main}` }}
                        />
                        <IconButton
                            color="primary"
                            component="span"
                            onClick={handleAvatarClick}
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: theme.palette.background.paper,
                                '&:hover': {
                                    backgroundColor: theme.palette.background.default,
                                },
                                border: `2px solid ${theme.palette.primary.main}`
                            }}
                        >
                            <PhotoCamera fontSize="small" />
                        </IconButton>
                        {/* Input file ẩn */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Box>

                    {/* Phần Form thông tin */}
                    <Box display="flex" flexDirection={"column"} gap={3} sx={{ width: '100%' }}>
                        <TextField
                            label="Họ và Tên"
                            name="fullName"
                            fullWidth
                            size='small'
                            value={editData.fullName}
                            onChange={handleChange}
                            variant="outlined"
                        />
                        <TextField
                            label="Email"
                            name="email"
                            fullWidth
                            size="small"
                            value={editData.email}
                            onChange={handleChange}
                            variant="outlined"
                            disabled // Thường email không cho phép sửa
                        />
                        <TextField
                            label="Số điện thoại"
                            name="phone"
                            fullWidth
                            size="small"
                            value={editData.phone}
                            onChange={handleChange}
                            variant="outlined"
                        />
                        <TextField
                            label="Địa chỉ"
                            name="address"
                            fullWidth
                            size="small"
                            value={editData.address}
                            onChange={handleChange}
                            variant="outlined"
                            multiline
                            rows={2}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    variant='outlined'
                    onClick={() => setOpen(false)}
                    color="error"
                >
                    Đóng
                </Button>
                <Button
                    variant='contained'
                    onClick={() => handleSave.mutate()}
                    color="primary"
                // Bạn có thể thêm logic kiểm tra xem có thay đổi gì không để disabled
                // disabled={!hasChanges}
                >
                    Lưu lại
                </Button>
            </DialogActions>
        </Dialog>
    )
}