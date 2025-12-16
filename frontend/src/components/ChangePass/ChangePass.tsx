import React, { useState, Dispatch, SetStateAction } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    InputAdornment,
    Box,
    Typography,
    useTheme
} from '@mui/material'
import { CloseRounded, Visibility, VisibilityOff } from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import UserService from '../../service/UserService'
import { showSuccessAlert } from '../Alert'
import { useAtom } from 'jotai'
import { userAtom } from '../../atoms/userAtoms'

// Props cho component
interface ChangePasswordProps {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

export default function ChangePass({ open, setOpen }: ChangePasswordProps) {
    const [user] = useAtom(userAtom)
    const theme = useTheme()
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        })
        // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
        setErrors({ ...errors, [e.target.name]: '' })
    }

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword)
    }

    const handleClose = () => {
        // Reset state khi đóng
        setPasswords({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        })
        setErrors({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        })
        setOpen(false)
    }

    const validate = () => {
        let isValid = true
        let newErrors = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }

        // Kiểm tra mật khẩu cũ (Giả định: không để trống)
        if (!passwords.oldPassword) {
            newErrors.oldPassword = 'Vui lòng nhập mật khẩu cũ.'
            isValid = false
        }

        // Kiểm tra mật khẩu mới (Giả định: ít nhất 6 ký tự)
        if (passwords.newPassword.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            isValid = false
        } else if (passwords.newPassword === passwords.oldPassword) {
            newErrors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu cũ.'
            isValid = false
        }

        // Kiểm tra xác nhận mật khẩu
        if (passwords.confirmPassword !== passwords.newPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp với mật khẩu mới.'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleChangePass = useMutation({
        mutationFn: (passwordsToSubmit: { oldPass: string, newPass: string }) =>
            UserService.changePass(passwordsToSubmit, user?._id),

        onSuccess: () => {
            showSuccessAlert('Đổi mật khẩu thành công!');
            handleClose(); // Đóng dialog và reset state
        },
        onError: (error: any) => {
            setErrors(prev => ({ ...prev, oldPassword: error.response.data.message || 'Mật khẩu cũ không chính xác hoặc lỗi hệ thống' }));
        }
    })

    const handleSubmit = async () => {
        if (!validate()) {
            return
        }

        const passwordsToSubmit = {
            oldPass: passwords.oldPassword,
            newPass: passwords.newPassword,
        };

        // Kích hoạt mutation
        handleChangePass.mutate(passwordsToSubmit);
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Typography variant="h6">Đổi mật khẩu</Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
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
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* Mật khẩu cũ */}
                    <TextField
                        label="Mật khẩu cũ"
                        name="oldPassword"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        value={passwords.oldPassword}
                        onChange={handleChange}
                        error={!!errors.oldPassword}
                        helperText={errors.oldPassword}
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Mật khẩu mới */}
                    <TextField
                        label="Mật khẩu mới"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        value={passwords.newPassword}
                        onChange={handleChange}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword || "Mật khẩu mới nên có ít nhất 6 ký tự."}
                        variant="outlined"
                    />

                    {/* Xác nhận mật khẩu mới */}
                    <TextField
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        value={passwords.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        variant="outlined"
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={handleClose} color="error">
                    Hủy bỏ
                </Button>
                <Button variant="contained" onClick={handleSubmit} color="primary">
                    Xác nhận đổi
                </Button>
            </DialogActions>
        </Dialog>
    )
}