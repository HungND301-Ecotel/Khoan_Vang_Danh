import React, { useState } from 'react';
import { LineChart } from '@mui/x-charts';
import { Container, Typography, Box, Paper, TextField, MenuItem } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// 1. DỮ LIỆU ẢO
const chartData = [
    { month: 'Tháng 1', planned: 500, actual: 520, profitLoss: -20 },
    { month: 'Tháng 2', planned: 550, actual: 530, profitLoss: 20 },
    { month: 'Tháng 3', planned: 600, actual: 610, profitLoss: -10 },
    { month: 'Tháng 4', planned: 650, actual: 640, profitLoss: 10 },
    { month: 'Tháng 5', planned: 700, actual: 720, profitLoss: -20 },
    { month: 'Tháng 6', planned: 750, actual: 730, profitLoss: 20 },
    { month: 'Tháng 7', planned: 800, actual: 810, profitLoss: -10 },
    { month: 'Tháng 8', planned: 850, actual: 840, profitLoss: 10 },
    { month: 'Tháng 9', planned: 900, actual: 920, profitLoss: -20 },
    { month: 'Tháng 10', planned: 950, actual: 930, profitLoss: 20 },
    { month: 'Tháng 11', planned: 1000, actual: 1010, profitLoss: -10 },
    { month: 'Tháng 12', planned: 1050, actual: 1040, profitLoss: 10 },
];

// Lấy danh sách tháng cho trục X
const xLabels = chartData.map(item => item.month);

// Hàm chuyển dữ liệu thành component
export default function CostProfitChart() {
    const [selectedYear, setSelectedYear] = useState('')
    return (
        <Paper elevation={3} sx={{ padding: 2, margin: 'auto' }}>
            <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                    Biểu đồ chi phí thực hiện, kế hoạch và lỗ/ lãi theo tháng
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                    <DatePicker
                        label="Chọn năm"
                        inputFormat="YYYY" // v5 vẫn hỗ trợ
                        views={['year']}
                        openTo="year"
                        value={selectedYear ? dayjs(selectedYear) : null}
                        onChange={(value) => {
                            setSelectedYear(value ? dayjs(value).format('YYYY') : '');
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                sx={{ backgroundColor: '#fff' }}
                            />
                        )}
                    />
                </LocalizationProvider>
            </Box>
            <Box sx={{ width: '100%', height: 400 }}>
                <LineChart
                    // Lấy dữ liệu 
                    dataset={chartData}

                    // Cấu hình trục X
                    xAxis={[
                        {
                            scaleType: 'band',
                            dataKey: 'month',
                            label: 'Tháng',
                            // Xoay nhãn 45 độ để tạo khoảng cách
                            tickLabelStyle: {
                                angle: -45,
                                textAnchor: 'end', // Căn chỉnh văn bản về cuối sau khi xoay
                                fontSize: 12,
                            },
                        },
                    ]}

                    // Cấu hình trục Y
                    yAxis={[
                        { id: 'cost', label: 'Chi phí (Đơn vị tiền)' },
                        { id: 'profitLoss', label: 'Lỗ/Lãi (Đơn vị tiền)' },
                    ]}

                    // Cấu hình các đường (series)
                    series={[
                        {
                            dataKey: 'planned',
                            label: 'Chi phí Kế hoạch',
                            yAxisKey: 'cost', // Dùng trục Y 'cost'
                            color: '#4caf50', // Màu xanh lá
                        },
                        {
                            dataKey: 'actual',
                            label: 'Chi phí Thực hiện',
                            yAxisKey: 'cost', // Dùng trục Y 'cost'
                            color: '#f44336', // Màu đỏ
                        },
                        {
                            dataKey: 'profitLoss',
                            label: 'Lỗ/Lãi',
                            yAxisKey: 'profitLoss', // Dùng trục Y 'profitLoss'
                            color: '#2196f3', // Màu xanh dương
                        },
                    ]}

                    // Kích thước biểu đồ
                    height={400}

                    // Hiển thị chú thích (Legend)
                    slotProps={{
                        legend: {
                            direction: 'column', // Hiển thị theo cột
                            position: { vertical: 'middle', horizontal: 'right' },
                            itemMarkWidth: 10,
                            itemMarkHeight: 10,
                            labelStyle: {
                                fontSize: 14,
                            },
                            padding: 10, // Thêm padding cho legend
                        },
                    }}
                />
            </Box>
        </Paper>
    );
};
