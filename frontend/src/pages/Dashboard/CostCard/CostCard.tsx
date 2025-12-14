import React from 'react';
import { Box, Typography, Paper, Stack, alpha } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { BarChart } from '@mui/x-charts/BarChart';

// Dữ liệu giả định cho biểu đồ (Mini-chart/Sparkline)
// Ví dụ: Số lượng cài đặt hàng ngày trong 7 ngày gần nhất
const dailyData = [300, 450, 400, 600, 550, 700, 650];

// Màu xanh dương nhạt được sử dụng trong hình ảnh
const chartColor = '#007bff';

// Dữ liệu cho BarChart
const chartData = [
    {
        data: dailyData,
        color: chartColor, // Áp dụng màu xanh
    },
];

// Cấu hình trục X và Y (không hiển thị)
const chartXAxis = [{
    scaleType: 'band' as const, // Thêm 'as const' để ép kiểu literal
    data: dailyData.map((_, i) => i)
}];
const chartYAxis = [{
    scaleType: 'linear' as const, // Thêm 'as const' để ép kiểu literal
    min: 0,
    max: Math.max(...dailyData) * 1.2
}];

export default function CostCard() {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                borderRadius: '12px',
                height: 200,
                backgroundColor: '#fff',
            }}
        >
            <Stack spacing={2}>

                {/* Hàng 1: Tiêu đề và Biểu đồ */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Tổng chi phí
                    </Typography>

                    {/* Mini-Chart (BarChart) */}
                    <Box sx={{ width: 100, height: 40, flexShrink: 0 }}>
                        <BarChart
                            // Bỏ các thành phần không cần thiết để tạo Sparkline
                            disableAxisListener
                            xAxis={chartXAxis}
                            yAxis={chartYAxis}
                            series={chartData}
                            height={40}
                            width={100}

                            // Tùy chỉnh Margin để biểu đồ chiếm hết không gian
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}

                            // Ẩn Tooltip khi di chuột
                            slotProps={{
                                legend: { hidden: true },
                                // Ẩn tooltip bằng cách không render
                            }}

                            // Tùy chỉnh Bar
                            sx={{
                                // Ẩn trục X và Y nếu chúng vẫn hiển thị
                                '& .MuiChartsAxis-root': { display: 'none' },
                                // Đảm bảo không có viền thừa
                                overflow: 'visible',
                            }}
                        />
                    </Box>
                </Box>

                {/* Hàng 2: Số liệu Chính */}
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    4,876
                </Typography>

                {/* Hàng 3: Tăng trưởng */}
                <Box display="flex" alignItems="center">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: alpha('#00c853', 0.1), // Màu xanh lá nhạt cho nền icon
                            borderRadius: '4px',
                            padding: '2px 4px',
                            mr: 1,
                        }}
                    >
                        <ArrowUpwardIcon sx={{ color: '#00c853', fontSize: 16 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        +0.2%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        last month
                    </Typography>
                </Box>

            </Stack>
        </Paper>
    );
}