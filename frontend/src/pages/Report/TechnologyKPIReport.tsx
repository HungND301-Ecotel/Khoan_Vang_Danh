import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography, Button, Box
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// 1. Định nghĩa dữ liệu tĩnh (Sử dụng cấu trúc trên)
// ... (Đặt cấu trúc STATIC_INDICATORS và StaticIndicatorItem đã định nghĩa ở trên vào đây)
interface StaticIndicatorItem {
    stt: string;
    label: string;
    unit: string;
    isGroup: boolean;
    isSubGroup: boolean;
    isBold: boolean;
}

const STATIC_INDICATORS: StaticIndicatorItem[] = [
    { stt: 'I', label: 'SẢN LƯỢNG', unit: '', isGroup: true, isSubGroup: false, isBold: true },
    { stt: '1', label: 'Than Nguyên Khai khai thác', unit: 'Tấn', isGroup: false, isSubGroup: false, isBold: true },
    { stt: '1.1', label: 'NK Lộ thiên', unit: 'Tấn', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '1.2', label: 'NK Hầm lò', unit: 'Tấn', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: 'Trong đó bao gồm', unit: '', isGroup: false, isSubGroup: true, isBold: false },
    { stt: '', label: '- Lò chợ CGH...', unit: 'Tấn', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò chợ giá khung (ZH, GK, Xích)', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò chợ giá TLĐP (XDY...)', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò chợ cột TL đơn', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò chợ chống gỗ', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò chợ khai thác phần tầng NN', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Khai thác ĐV phần tầng', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Đào lò lấy than', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Than Đào lò CBSX', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Than Xén lò', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Than Đào lò XDCB', unit: '"', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '2', label: 'Bóc đất đá lộ thiên', unit: '1000m3', isGroup: true, isSubGroup: false, isBold: true },
    { stt: '', label: '- Tự làm', unit: '', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Thuê ngoài', unit: '', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '3', label: 'Đào lò tổng số', unit: 'm', isGroup: true, isSubGroup: false, isBold: true },
    { stt: '3.1', label: 'Đào lò XDCB', unit: 'm', isGroup: false, isSubGroup: false, isBold: true },
    { stt: '', label: '- Lò đá', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Lò than', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '3.2', label: 'Đào lò CBSX', unit: 'm', isGroup: false, isSubGroup: false, isBold: true },
    { stt: 'a', label: 'Theo tính chất đất đá', unit: 'm', isGroup: false, isSubGroup: false, isBold: true },
    { stt: '', label: '- Đào lò trong đá', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '* Tiết diện bình quân', unit: 'm2', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Đào lò trong than', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '* Tiết diện bình quân', unit: 'm2', isGroup: false, isSubGroup: false, isBold: false },
    { stt: 'b', label: 'Theo vật liệu chống', unit: 'm', isGroup: false, isSubGroup: false, isBold: true },
    { stt: '', label: '- Chống neo đá', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Chống neo than', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Chống sắt', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Chống gỗ', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Chống bê tông lưu vi', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: 'c', label: 'Mét lò đất rãy', unit: 'm', isGroup: false, isSubGroup: false, isBold: true },
    { stt: '4', label: 'Mét lò xén CBSX', unit: 'm', isGroup: true, isSubGroup: false, isBold: true },
    { stt: '', label: '- Chống sắt', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
    { stt: '', label: '- Chống gỗ', unit: 'm', isGroup: false, isSubGroup: false, isBold: false },
];
// --- Hết dữ liệu tĩnh ---

// Giả lập state để lưu trữ giá trị của các ô input (6 cột input)
// Mỗi mục sẽ có một ID duy nhất và 6 giá trị
type IndicatorValues = {
    [key: string]: (string | number)[]; // Key: STT + Label, Value: [QĐ1, Thực hiện, QĐ4, QĐ5, Tỷ lệ, Giá trị khác...]
}

export default function TechnologyKPIReport() {
    // Khởi tạo state dựa trên cấu trúc tĩnh (tạo ID duy nhất cho mỗi dòng)
    const initialValues: IndicatorValues = STATIC_INDICATORS.reduce((acc, item, index) => {
        // Tạo một ID duy nhất kết hợp với index để tránh trùng lặp
        const uniqueId = `${item.stt}_${item.label}_${index}`;
        // Khởi tạo 6 giá trị rỗng cho 6 cột dữ liệu cần nhập/hiển thị
        acc[uniqueId] = new Array(6).fill('');
        return acc;
    }, {} as IndicatorValues);

    const [inputValues, setInputValues] = useState<IndicatorValues>(initialValues);

    // Cập nhật giá trị input
    const handleInputChange = (id: string, colIndex: number, value: string) => {
        setInputValues(prev => ({
            ...prev,
            [id]: prev[id].map((v, i) => (i === colIndex ? value : v)),
        }));
        // Ở đây bạn có thể thêm logic tính toán Tỷ lệ (%)
    };

    // Hàm xuất Excel (chỉ minh họa, cần thư viện xlsx)
    const handleExport = () => {
        alert('Chức năng xuất Excel sẽ được thực hiện tại đây.');
        // Cần tích hợp thư viện xlsx và logic chuyển đổi bảng thành sheet
    };

    // Số cột dữ liệu (không bao gồm TT, Chỉ tiêu, ĐVT)
    const DATA_COLUMNS = 4;
    const INPUT_WIDTH = '70px';

    return (
        <Paper sx={{ p: 3, width: "calc(100vw - 10rem)", margin: 'auto', }}>
            <Button
                variant="contained"
                onClick={handleExport}
                startIcon={<FileDownloadIcon />}
                sx={{ mb: 2 }}
            >
                Xuất file Excel
            </Button>
            <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                THỰC HIỆN CÁC CHỈ TIÊU CÔNG NGHỆ CHỦ YẾU NĂM 202...
            </Typography>

            <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        {/* Hàng tiêu đề 1 */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>TT</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ minWidth: 250, border: '1px solid #a8a8a4ff' }}>Chỉ tiêu</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>ĐVT</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Kế hoạch (QĐ...)</TableCell>
                            <TableCell rowSpan={3} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thực hiện</TableCell>
                            <TableCell colSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Tỷ lệ (%)</TableCell>
                        </TableRow>
                        {/* Hàng tiêu đề 2 */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>QĐ ...</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>QĐ ...</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {STATIC_INDICATORS.map((row, index) => {
                            const uniqueId = `${row.stt}_${row.label}_${index}`;
                            return (
                                <TableRow
                                    key={uniqueId}
                                // Tạo màu nền đặc biệt cho các dòng nhóm cha
                                >
                                    <TableCell align="center" sx={{ fontWeight: row.isBold ? 'bold' : 'normal', border: '1px solid #a8a8a4ff' }}>
                                        {row.stt}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: row.isBold ? 'bold' : 'normal',
                                            border: '1px solid #a8a8a4ff',
                                            paddingLeft: row.isSubGroup ? '24px' : '16px' // Thụt lề cho mục con
                                        }}
                                    >
                                        {row.label}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontStyle: 'italic', border: '1px solid #a8a8a4ff' }}>
                                        {row.unit}
                                    </TableCell>

                                    {/* Render 6 cột dữ liệu */}
                                    {Array.from({ length: DATA_COLUMNS }).map((_, colIndex) => (
                                        <TableCell key={colIndex} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>
                                            {/* Chỉ các dòng không phải là nhóm cha mới có input */}
                                            {/* {!(row.isGroup || row.isSubGroup) && (
                                                <TextField
                                                    size="small"
                                                    variant="outlined"
                                                    value={inputValues[uniqueId]?.[colIndex] || ''}
                                                    onChange={(e) => handleInputChange(uniqueId, colIndex, e.target.value)}
                                                    type="number"
                                                    sx={{ width: INPUT_WIDTH }}
                                                    inputProps={{ style: { padding: '5px 8px', textAlign: 'center' } }}
                                                />
                                            )} */}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}