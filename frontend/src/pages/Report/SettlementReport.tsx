import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography, Button, Box
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// (Giả định SettlementItem và SETTLEMENT_INDICATORS đã được định nghĩa ở trên)
interface SettlementItem {
    id: string;
    stt: string;
    label: string;
    unit: string;
    isGroup: boolean;
    isSubGroup: boolean;
    isBold: boolean;
    isInput: boolean;
}
// ... (Sử dụng mảng SETTLEMENT_INDICATORS đầy đủ từ bước 1)
const SETTLEMENT_INDICATORS: SettlementItem[] = [
    { id: 'A', stt: 'A', label: 'THỰC HIỆN CÁC CHỈ TIÊU', unit: '', isGroup: true, isSubGroup: false, isBold: true, isInput: false },
    { id: 'A1', stt: '1', label: 'Chi tiêu hiện vật', unit: '', isGroup: false, isSubGroup: true, isBold: true, isInput: false },
    { id: 'A1_1', stt: '', label: '+Than nguyên khai', unit: 'Tấn', isGroup: false, isSubGroup: false, isBold: false, isInput: true },
    { id: 'A1_2', stt: '', label: '+Mét lò đào', unit: 'm', isGroup: false, isSubGroup: false, isBold: false, isInput: true },
    { id: 'A1_3', stt: '', label: '+Mét lò xén', unit: 'm', isGroup: false, isSubGroup: false, isBold: false, isInput: true },
    { id: 'A2', stt: '2', label: 'Doanh thu', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: true, isInput: false },
    { id: 'B', stt: '*', label: 'Chi tiết theo yếu tố', unit: '', isGroup: true, isSubGroup: false, isBold: true, isInput: false },
    { id: 'B1', stt: '1', label: 'Chi phí nguyên vật liệu', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B2', stt: '2', label: 'Chi phí điện năng', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B3', stt: '3', label: 'Chi phí tiền lương', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B4', stt: '4', label: 'Chi phí KHTS CĐ', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B5', stt: '5', label: 'Chi phí BHXH + YT + TN + KPCĐ', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B6', stt: '6', label: 'Chi phí khác', unit: 'Đồng', isGroup: false, isSubGroup: true, isBold: false, isInput: false },
    { id: 'B6_1', stt: '-', label: 'Chi phí ăn định lượng, ăn giữa ca và bồi dưỡng độc hại', unit: 'Đồng', isGroup: false, isSubGroup: false, isBold: false, isInput: false },
];
// --- End Data ---

// Chỉ cần lưu trữ giá trị Khối lượng thực hiện (input chính)
type SettlementValues = {
    [indicatorId: string]: number | string;
}

export default function SettlementReport() {

    // Khởi tạo state chỉ cho các dòng có isInput = true
    const initialValues: SettlementValues = SETTLEMENT_INDICATORS
        .filter(item => item.isInput)
        .reduce((acc: SettlementValues, item) => {
            acc[item.id] = ''; // Khởi tạo giá trị rỗng
            return acc;
        }, {} as SettlementValues);

    const [inputValues, setInputValues] = useState<SettlementValues>(initialValues);
    const INPUT_WIDTH = '100px';

    const handleInputChange = (id: string, value: string) => {
        const numericValue = value === '' ? '' : parseFloat(value);
        setInputValues(prev => ({
            ...prev,
            [id]: numericValue,
        }));
        // Trong môi trường thực tế: Cần gọi API/hàm tính toán để cập nhật các cột 'Giá thành/Tấn', 'Thành tiền', 'Chênh lệch'
    };

    // Hàm giả lập lấy giá trị đã tính toán (thường từ API hoặc state)
    const getCalculatedValue = (id: string, column: 'giaThanh' | 'thanhTien' | 'chechLech', isKeHoach: boolean = true) => {
        // Đây là nơi bạn sẽ gọi selector để lấy giá trị đã tính từ Redux/Context/Cache
        // Ví dụ: return calculatedResults[id][column][isKeHoach ? 'KH' : 'TH'];

        // Hiện tại: chỉ trả về '-' hoặc giá trị mô phỏng
        if (id === 'A2' || id === 'C' || id.startsWith('B')) {
            return '—'; // Không nhập
        }
        return Math.floor(Math.random() * 50000000).toLocaleString('vi-VN');
    };

    const handleExport = () => {
        alert('Xuất file Excel cho Biên bản Tổng hợp Quyết toán Giao khoán.');
    };

    const handleSubmit = () => {
        const dataToSave = Object.keys(inputValues).map(id => ({
            indicatorId: id,
            khoiLuongThucHien: inputValues[id]
        }));
        console.log("Dữ liệu Khối lượng thực hiện gửi đi:", dataToSave);
        alert("Đã lưu khối lượng thực hiện.");
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
            <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
                BIÊN BẢN TỔNG HỢP QUYẾT TOÁN GIAO KHOÁN NĂM 2025
            </Typography>


            <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        {/* Hàng tiêu đề 1 */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>TT</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ minWidth: 250, border: '1px solid #a8a8a4ff' }}>Yếu tố chi phí</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>ĐVT</TableCell>

                            <TableCell colSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Kế hoạch</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Khối lượng thực hiện</TableCell>
                            <TableCell colSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thực hiện</TableCell>
                            <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Chênh lệch lãi (-), lỗ (-)</TableCell>
                        </TableRow>
                        {/* Hàng tiêu đề 2 (Chi tiết Kế hoạch/Thực hiện) */}
                        <TableRow sx={{ backgroundColor: '#e0f0ff' }}>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Giá thành (đồng/tấn)</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thành tiền (đồng)</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Giá thành (đồng/tấn)</TableCell>
                            <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>Thành tiền (đồng)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {SETTLEMENT_INDICATORS.map((row) => (
                            <TableRow
                                key={row.id}
                            >
                                <TableCell align="center" sx={{ fontWeight: row.isBold ? 'bold' : 'normal', border: '1px solid #a8a8a4ff' }}>
                                    {row.stt}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: row.isBold ? 'bold' : 'normal',
                                        paddingLeft: row.stt === '+' || row.stt === '-' ? '32px' : '16px',
                                        border: '1px solid #a8a8a4ff'
                                    }}
                                >
                                    {row.label}
                                </TableCell>
                                <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>{row.unit}</TableCell>

                                {/* 1. Kế hoạch (Chỉ hiển thị) */}
                                <TableCell align="right" sx={{ border: '1px solid #a8a8a4ff' }}></TableCell>
                                <TableCell align="right" sx={{ border: '1px solid #a8a8a4ff' }}></TableCell>

                                {/* 2. Khối lượng thực hiện (Input) */}
                                <TableCell align="center" sx={{ border: '1px solid #a8a8a4ff' }}>
                                    {/* {row.isInput ? (
                                        <TextField
                                            size="small" variant="outlined" sx={{ width: INPUT_WIDTH }} type="number"
                                            value={inputValues[row.id] || ''}
                                            onChange={(e) => handleInputChange(row.id, e.target.value)}
                                            inputProps={{ style: { padding: '5px 8px', textAlign: 'center' } }}
                                        />
                                    ) : '—'} */}
                                </TableCell>

                                {/* 3. Thực hiện (Chỉ hiển thị) */}
                                <TableCell align="right" sx={{ border: '1px solid #a8a8a4ff' }}></TableCell>
                                <TableCell align="right" sx={{ border: '1px solid #a8a8a4ff' }}></TableCell>

                                {/* 4. Chênh lệch (Chỉ hiển thị) */}
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: row.id === 'C' ? 'red' : 'inherit', border: '1px solid #a8a8a4ff' }}>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}