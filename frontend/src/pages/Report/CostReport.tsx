import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography, Button, Box
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Đảm bảo kiểu dữ liệu đã được định nghĩa
interface CostIndicatorItem {
    stt: string; // TT
    label: string; // Yếu tố chi phí
    unit: string; // ĐVT
    isGroup: boolean; // I. VẬT LIỆU
    isSubGroup: boolean; // 1.1 Thuốc nổ
    isDetail: boolean; // + Cho lò chợ
    isBold: boolean;
}

// Giả định COST_INDICATORS đã được định nghĩa ở trên
const COST_INDICATORS: CostIndicatorItem[] = [
    // ... (Đặt toàn bộ mảng dữ liệu tĩnh ở đây)
    { stt: 'I', label: 'VẬT LIỆU', unit: '', isGroup: true, isSubGroup: false, isDetail: false, isBold: true },
    { stt: 'A', label: 'Vật liệu phụ chủ yếu', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '1.1', label: 'Thuốc nổ', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '', label: '+ Cho khai thác hầm lò', unit: 'Kg/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho lò chợ', unit: 'Kg/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho đào lò than', unit: 'Kg/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho đào lò đá', unit: 'Kg/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho khai thác lộ thiên', unit: 'Kg/1000m3', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '1.2', label: 'Kíp nổ', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '', label: '+ Cho khai thác hầm lò', unit: 'cái/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho lò chợ', unit: 'cái/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho đào lò than', unit: 'cái/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho đào lò đá', unit: 'cái/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Cho khai thác lộ thiên', unit: 'cái/1000m3', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '1.3', label: 'Dây mìn điện', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '', label: '- Cho hầm lò', unit: 'm/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '- Cho lộ thiên', unit: 'm/1000m3', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '2', label: 'Gỗ chống lò', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '', label: 'Gỗ chống', unit: 'm3/1000T', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: 'Gỗ chèn', unit: '', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '- Cho lò chợ', unit: 'm3/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '- Cho đào lò', unit: 'm3/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Chống sắt', unit: '', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Chống gỗ', unit: '', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '- Cho xén lò', unit: 'm3/m', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Xén sắt', unit: '', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '', label: '+ Xén gỗ', unit: '', isGroup: false, isSubGroup: false, isDetail: true, isBold: false },
    { stt: '3', label: 'Gỗ tả vẹt, nhu cầu khác', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '4', label: 'Cột, xà chống thủy lực', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '5', label: 'Lưới thép B40', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '6', label: 'Cầu máng cào', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '7', label: 'Đèn ắc quy cho lò', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '8', label: 'Tấm chèn bê tông', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '9', label: 'Ray P24 (đặt ray lò)', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '10', label: 'Mũi khoan than', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '11', label: 'Mũi khoan đá', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '12', label: 'Chòong khoan than', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '13', label: 'Chòong khoan đá', unit: 'm3/1000T', isGroup: false, isSubGroup: true, isDetail: true, isBold: true },
    { stt: '*', label: 'Vật liệu cho SC lớn', unit: 'đ/tấn', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: 'C', label: 'Dầu mỡ phụ', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '1', label: 'Dầu nhờn', unit: '% so NL', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '2', label: 'Mỡ máy', unit: '% so NL', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '3', label: 'Dầu nhũ hóa ( cột thủy lực )', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: 'D', label: 'Vật liệu phụ khác', unit: '', isGroup: false, isSubGroup: true, isDetail: false, isBold: true },
    { stt: '1', label: 'Cầu máng trượt', unit: '% so NL', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '2', label: 'Ống gió vải cao su', unit: '% so NL', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '3', label: 'Mặt băng tải', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '4', label: 'Ru lô, con lăn băng tải', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '5', label: 'Bình ắc quy tàu điện', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '6', label: 'Búa lô', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '7', label: 'Cuốc chim', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '8', label: 'Xẻng xúc than', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '9', label: 'Xút NAOH', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '10', label: 'A xit H2SO4', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '11', label: 'Các loại khác', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },
    { stt: '', label: 'Vật tư khác', unit: 'lit/1000T', isGroup: false, isSubGroup: false, isDetail: false, isBold: false },

];


// Kiểu dữ liệu cho giá trị input
type CostValues = {
    [key: string]: (string | number)[];
}

export default function CostReport() {

    // Tổng cộng 12 cột dữ liệu cần nhập/hiển thị
    const DATA_COLUMNS = 10;
    const INPUT_WIDTH = '70px';

    // Khởi tạo state cho tất cả các input
    const initialValues: CostValues = COST_INDICATORS.reduce((acc: CostValues, item, index) => {
        const uniqueId = `${item.stt}_${item.label}_${index}`;
        // 12 ô input/giá trị cho mỗi dòng chi tiết
        acc[uniqueId] = new Array(DATA_COLUMNS).fill('');
        return acc;
    }, {} as CostValues);

    const [inputValues, setInputValues] = useState<CostValues>(initialValues);

    const handleInputChange = (id: string, colIndex: number, value: string) => {
        setInputValues(prev => ({
            ...prev,
            [id]: prev[id].map((v, i) => (i === colIndex ? value : v)),
        }));
        // Logic tính toán Thành tiền, SS với kế hoạch, v.v. sẽ được thêm ở đây
    };

    const handleExport = () => {
        alert('Xuất file Excel cho Báo cáo chi phí.');
    };

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
                BÁO CÁO THỰC HIỆN KẾ HOẠCH ĐIỀU HÀNH CHI PHÍ THEO YẾU TỐ
            </Typography>

            <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        {/* Hàng tiêu đề 1 */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            <TableCell rowSpan={2} align="center" sx={{ width: 50, border: '1px solid #a8a8a4ff' }}>TT</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ minWidth: 250, border: '1px solid #a8a8a4ff' }}>Yếu tố chi phí</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ width: 70, border: '1px solid #a8a8a4ff' }}>ĐVT</TableCell>

                            <TableCell colSpan={4} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Kế hoạch điều hành chi phí</TableCell>
                            <TableCell colSpan={4} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thực hiện năm</TableCell>
                            <TableCell align="center" rowSpan={2} sx={{ border: '1px solid #a8a8a4ff' }}>SS với kế hoạch năm (%)</TableCell>
                            <TableCell align="center" rowSpan={2} sx={{ border: '1px solid #a8a8a4ff' }}>SS với bình quân 3 năm liền kề (%)</TableCell>
                        </TableRow>

                        {/* Hàng tiêu đề 3 */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            {/* Kế hoạch */}
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Định mức</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>KL/CV</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Đơn giá</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thành tiền</TableCell>
                            {/* Thực hiện */}
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Định mức</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>KL/CV</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Đơn giá</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thành tiền</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {COST_INDICATORS.map((row, index) => {
                            const uniqueId = `${row.stt}_${row.label}_${index}`;

                            // Xác định mức độ thụt lề (indentation)
                            let paddingLeft = '16px';
                            if (row.label.startsWith('+')) paddingLeft = '32px';
                            if (row.label.startsWith('-')) paddingLeft = '32px';

                            return (
                                <TableRow
                                    key={uniqueId}
                                >
                                    <TableCell align="center" sx={{ fontWeight: row.isBold ? 'bold' : 'normal', border: '1px solid #a8a8a4ff' }}>
                                        {row.stt}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: row.isBold ? 'bold' : 'normal',
                                            paddingLeft: paddingLeft,
                                            border: '1px solid #a8a8a4ff'
                                        }}
                                    >
                                        {row.label}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontStyle: 'italic', border: '1px solid #a8a8a4ff' }}>
                                        {row.unit}
                                    </TableCell>

                                    {/* Render 12 cột dữ liệu */}
                                    {Array.from({ length: DATA_COLUMNS }).map((_, colIndex) => (
                                        <TableCell key={colIndex} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>
                                            {/* Chỉ các dòng chi tiết mới có input */}
                                            {/* {row.isDetail && (
                                                <TextField
                                                    size="small"
                                                    variant="outlined"
                                                    value={inputValues[uniqueId]?.[colIndex] || ''}
                                                    onChange={(e) => handleInputChange(uniqueId, colIndex, e.target.value)}
                                                    type="number"
                                                    sx={{ width: INPUT_WIDTH }}
                                                    // Chỉ các cột tính toán (Thành tiền, SS) nên là chỉ đọc
                                                    disabled={colIndex === 3 || colIndex === 7 || colIndex === 8 || colIndex === 9 || colIndex === 10 || colIndex === 11}
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