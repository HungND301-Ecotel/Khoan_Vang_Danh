import { CloseRounded } from '@mui/icons-material'
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fade, IconButton, TextField, useTheme } from '@mui/material'
import { useAtom } from 'jotai'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { userAtom } from '../../atoms/userAtoms'

export default function Profile({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const [user] = useAtom(userAtom)
    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            {/* <DialogTitle>Thông tin tài khoản</DialogTitle> */}
            <IconButton sx={{ position: 'absolute', top: 0, right: 0 }}>
                <CloseRounded />
            </IconButton>
            <DialogContent>
                <Box display="flex" flexDirection={'column'} alignItems={'center'} gap={4}>
                    <Avatar src={'./logo.png'} sx={{ width: 100, height: 100}} />
                    <Box display="flex" flexDirection={"column"} gap={2} sx={{ width: '100%' }}>
                        <TextField fullWidth size='small' value={user?.fullName || ''} />
                        <TextField fullWidth size="small" value={user?.email || ''} />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant='outlined' onClick={() => setOpen(false)}>Đóng</Button>
                <Button variant='contained'>Lưu lại</Button>
            </DialogActions>
        </Dialog>
    )
}
