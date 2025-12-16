import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Box, // Thêm Box để bố cục linh hoạt hơn
    Paper,
    Table,
    TableBody,
    TableRow,
    TableCell,
    TableHead, // Thêm Paper cho vùng kéo thả
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile"; // Icon tải lên
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Icon thành công
import { Dispatch, SetStateAction, useState, useCallback, useMemo } from "react";
// Import XLSX chỉ dùng cho kiểu dữ liệu, logic xử lý file vẫn nằm ở hàm readExcelFile
import * as XLSX from "xlsx";
import { showErrorAlert, showSuccessAlert } from "../Alert";

// Định nghĩa kiểu dữ liệu cho dữ liệu đầu vào và đầu ra
type ExcelDataItem = {
    code: string;
    norm: number;
};

export default function SimpleImportModal({ open, setOpen, onImport, readExcelFile, type }: {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    onImport: (excelData: ExcelDataItem[]) => void,
    readExcelFile: (file: File) => Promise<any[]>,
    type?: string
}) {
    const [file, setFile] = useState<File | null>(null);

    // --- LOGIC XỬ LÝ FILE (không thay đổi) ---
    const handleFileUpload = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const handleProcessImport = async () => {
        if (!file) return;

        try {
            const rawData: any[] = await readExcelFile(file);

            // Giả định: Bỏ qua hàng đầu tiên (header)
            const dataRows = rawData.slice(0);

            const processedData: ExcelDataItem[] = dataRows.filter((f: any) => f[0]).map(row => ({
                // Đảm bảo kiểu dữ liệu đầu ra là string/number
                code: String(row[0] || ''),
                norm: Number(row[1] || 0),
            }));

            onImport(processedData);
            setOpen(false); // Đóng modal sau khi import thành công
            setFile(null); // Reset file
            showSuccessAlert(`Tải lên thành công`)
        } catch (error) {
            showErrorAlert("Lỗi xử lý file Excel:");
            // Có thể thêm state để hiển thị thông báo lỗi cho người dùng ở đây
        }
    };
    // ------------------------------------------

    // --- LOGIC KÉO THẢ (Drag and Drop) ---
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            handleFileUpload(droppedFile);
        }
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);
    // --------------------------------------

    const handleClose = () => {
        setOpen(false);
        setFile(null); // Reset file khi đóng modal
    };

    const isFileSelected = !!file;


    const handleExport = () => {
        const dataToExport = [{
            // Giữ nguyên các khóa, nhưng Excel sẽ chỉ thấy các giá trị
            'code': type === "material" ? 'Mã vật tư (vd: GL01206VNMM)' : `Mã giao khoán (vd: KT12)`,
            'value': type === "material" ? "Số lượng (vd: 10)" : "Định mức (vd: 1.25)",
        }];

        // SỬA ĐỔI: Thêm tùy chọn { skipHeader: true }
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });

        const columnWidths = [
            { wch: 30 },
            { wch: 20 }
        ];

        // Gán định nghĩa chiều rộng vào thuộc tính !cols của worksheet
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Mẫu");
        XLSX.writeFile(workbook, "file_mau.xlsx");
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '12px' } }}
        >
            <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #eee' }}>
                📥 Tải lên {type === "material" ? "dữ liệu vật tư" : "dữ liệu định mức"}
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 2 }}>

                {/* Hướng dẫn và Mẫu Dữ liệu */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Tải lên file định dạng **.xlsx, .xls, hoặc .csv**. File của bạn cần có cấu trúc như sau:
                </Typography>

                <Paper variant="outlined" sx={{ mb: 2, p: 1, borderRadius: '4px', bgcolor: '#fafafa' }}>
                    <Box display="flex" justifyContent={"space-between"}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, p: 0.5 }}>
                            📝 Quy ước Cấu trúc File
                        </Typography>
                        <Button onClick={handleExport}>Tải file mẫu</Button>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ border: '1px solid #ddd' }}>Cột A</TableCell>
                                <TableCell sx={{ border: '1px solid #ddd' }}>Cột B</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ border: '1px solid #ddd' }}>
                                    {type === "material" ? 'Mã vật tư (vd: GL01206VNMM)' : `Mã giao khoán (vd: KT12)`}
                                </TableCell>
                                <TableCell sx={{ border: '1px solid #ddd' }}>{type === "material" ? "Số lượng (vd: 10)" : "Định mức (vd: 1.25)"}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Paper>

                {/* Vùng Tải Lên (Dropzone/Input) */}
                <Paper
                    variant="outlined"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderColor: isFileSelected ? 'success.main' : 'primary.main',
                        borderStyle: 'dashed',
                        borderWidth: isFileSelected ? '2px' : '1px',
                        transition: 'border 0.3s',
                        position: 'relative',
                        bgcolor: isFileSelected ? '#e8f5e9' : '#fff',
                    }}
                >
                    <input
                        type="file"
                        onChange={(e) => {
                            if (e.target.files) handleFileUpload(e.target.files[0]);
                        }}
                        accept=".xlsx, .xls, .csv"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                        }}
                    />

                    {!isFileSelected ? (
                        <Box>
                            <UploadFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" color="primary">
                                **Kéo thả file** hoặc **Nhấn để chọn file**
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                (Tối đa 1 file: .xlsx, .xls, .csv)
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ color: 'success.main' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                File đã chọn: {file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.dark' }}>
                                Nhấn vào đây để thay đổi file khác
                            </Typography>
                        </Box>
                    )}
                </Paper>

            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid #eee' }}>
                <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleProcessImport}
                    disabled={!isFileSelected}
                    variant="contained"
                    sx={{ textTransform: 'none', minWidth: '120px' }}
                >
                    Tải lên
                </Button>
            </DialogActions>
        </Dialog>
    );
};