import { Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { Table } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react'
import PhaseTable from './PhaseTable';
import { showConfirmAlert } from '../../components/Alert';

export default function GroupTable({
    data,
    handleOpen,
    productionScope,
    handleDeleteMutation
}: {
    data: any[];
    handleOpen: (record: any) => void;
    productionScope?: any;
    handleDeleteMutation: (ids: React.Key[]) => void;
}) {
    const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleView = (record: any) => {
        const id = record?._id;
        if (!id) return;

        setExpandedRow((prev) => (prev === id ? null : id));
    };


    const expandedRowRender = (record: any) => {
        const key = record._id || "";
        const data = expandedData[key] || record;
        if (data === null) {
            return (
                <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography color="error">
                        Không thể tải thông tin chi tiết. Có thể bản ghi đã bị xóa.
                    </Typography>
                </Box>
            );
        }
        if (!data.phases) {
            return <Box sx={{ p: 2 }}>Đang tải...</Box>;
        }
        return <Box sx={{ padding: '10px' }}>
            <PhaseTable data={data.phases} materials={data.materials} />
        </Box>
    };
    const innerColumns = [
        {
            title: '',
            dataIndex: "month",
            key: "month",
            render: (text: string, item: any, index: number) => (
                <Typography fontWeight="bold">{text ? dayjs(text).format("MM/YYYY") : ''}</Typography>
            ),
        },
        {
            title: '',
            width: 150,
            dataIndex: "total",
            key: "total",
            render: (text: string, item: any) => (
                <Typography sx={{ fontWeight: "bold" }}>{item.totalUsedCost ? item.totalUsedCost.toLocaleString() : ""}</Typography>
            ),
        },
        {
            title: '',
            dataIndex: "view",
            key: "view",
            width: 50,
            align: "center" as const,
            render: (_: any, record: any) => (
                <IconButton
                    onClick={() => handleView(record)}
                    sx={{
                        color: "#666",
                        "&:hover": {
                            color: "#1976d2",
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                    }}
                >
                    {expandedRow === record?._id ? <Visibility /> : <VisibilityOff />}
                </IconButton>
            ),
        },
        {
            title: '',
            dataIndex: "add",
            key: "add",
            width: 50,
            align: "center" as const,
            render: (_: any, record: any) => (
                <IconButton
                    onClick={() => handleOpen({
                        ...record,
                        productionScope: productionScope
                    })}
                    sx={{
                        color: "#666",
                        "&:hover": {
                            color: "#1976d2",
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                    }}
                >
                    <Edit />
                </IconButton>
            ),
        },
        {
            title: '',
            dataIndex: "delete",
            key: "delete",
            width: 50,
            align: "center" as const,
            render: (_: any, record: any) => (
                <IconButton
                    onClick={async () => {
                        const isConfirmed = await showConfirmAlert('Bạn có chắc muốn xóa bản ghi này không?. Không thể hoàn tác.')
                        if (isConfirmed) {
                            handleDeleteMutation([record._id])
                        }
                    }}
                    sx={{
                        color: "#666",
                        "&:hover": {
                            color: "#1976d2",
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                    }}
                >
                    <Delete />
                </IconButton>
            ),
        },
    ];
    return (
        <Paper>
            <Table
                columns={innerColumns}
                dataSource={data || []}
                pagination={false}
                size="small"
                rowKey={(item) => item._id}
                showHeader={false}
                expandable={{
                    expandedRowKeys: expandedRow ? [expandedRow] : [],
                    onExpand: (expanded, record) => {
                        setExpandedRow(expanded ? record.key || null : null);
                    },
                    expandedRowRender,
                    showExpandColumn: false
                }}
                onRow={() => ({
                    className: "custom-row"
                })}
                rowClassName={(record, index) => (
                    // Thêm class 'first-data-row' cho hàng đầu tiên
                    index === 0 ? "custom-row first-data-row" : "custom-row"
                )}
            />
            <style>{`
                .custom-row > td {
                background-color: #dcd7d7fa !important;
                }
            `}</style>
        </Paper>
    )
}
