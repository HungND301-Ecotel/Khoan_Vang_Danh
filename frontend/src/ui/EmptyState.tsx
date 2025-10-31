import { Box, Button, Typography } from '@mui/material'
import React from 'react'

export default function EmptyState({
    searchValue,
    handleClearSearch
}: {
    searchValue: String,
    handleClearSearch: () => void
}) {
    return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchValue ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchValue
                    ? `Không có bản ghi nào phù hợp với "${searchValue}"`
                    : "Hiện tại chưa có bản ghi nào được tạo"
                }
            </Typography>
            {searchValue && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ mt: 1 }}
                >
                    Xóa bộ lọc
                </Button>
            )}
        </Box>
    )
}
