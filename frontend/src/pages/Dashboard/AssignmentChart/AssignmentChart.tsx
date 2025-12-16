import { Box, Paper, Typography } from '@mui/material'
import React from 'react'
import { PieChart } from '@mui/x-charts';
import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api.config';

export default function AssignmentChart() {
    const {
        data: materialAssignments = {
            countWithAssignment: 0,
            countWithoutAssignment: 0,
            totalCount: 0
        },
    } = useQuery({
        queryKey: ["materialAssignments"],
        queryFn: async () => {
            try {
                const response = await api.get(
                    `/materialAssignments/getCount`
                );
                return response.data.data;
            } catch (error) {
                return [];
            }
        },
    });
    return (
        <Paper elevation={3} sx={{ padding: 3, borderRadius: '12px', height: 200 }}>
            {/* Tiêu đề chính của component */}
            <Box display="flex" justifyContent={"space-between"}>
                <Typography variant="h6" gutterBottom>
                    Mã giao khoán
                </Typography>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    {materialAssignments.totalCount}
                </Typography>
            </Box>

            <PieChart
                series={[
                    {
                        data: [
                            { id: 0, value: materialAssignments.countWithAssignment, label: `Trong khoán (${materialAssignments.countWithAssignment})` },
                            { id: 1, value: materialAssignments.countWithoutAssignment, label: `Ngoài khoán (${materialAssignments.countWithoutAssignment})` },
                        ],
                        // Đảm bảo highlightScope dùng 'faded' theo phiên bản mới nhất
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        innerRadius: 20,
                        outerRadius: 50, // Giảm outerRadius một chút để chừa chỗ cho legend
                        paddingAngle: 0,
                        cornerRadius: 5,
                    },
                ]}
                // Tăng kích thước của biểu đồ để dễ nhìn hơn
                height={100}

                // Cấu hình Legend (Chú thích)
                // Đặt Legend ở bên phải, căn giữa theo chiều dọc
                slotProps={{
                    legend: {
                        direction: 'column', // Hiển thị theo cột
                        position: { vertical: 'middle', horizontal: 'right' },
                        itemMarkWidth: 10,
                        itemMarkHeight: 10,
                        labelStyle: {
                            fontSize: 14,
                        },
                        padding: 5, // Thêm padding cho legend
                    },
                }}
            />
        </Paper>
    )
}