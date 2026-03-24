import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Button,
  Box,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// (Giả định MaterialItem và MATERIAL_CONSUMPTION đã được định nghĩa ở trên)
interface MaterialItem {
  id: string;
  label: string;
  unit: string;
  unitPrice: number;
}
const MATERIAL_CONSUMPTION: MaterialItem[] = [
  {
    id: "KT10",
    label: "Gỗ chèn Ф8-12, L=2.2-2.4m",
    unit: "m²",
    unitPrice: 1054.664,
  },
  {
    id: "KT11",
    label: "Gỗ chèn Ф13-17, L=2-2.5m",
    unit: "m²",
    unitPrice: 1269.69,
  },
  { id: "KT12", label: "Thuốc nổ NTLT-2", unit: "kg", unitPrice: 42.578 },
  { id: "KT13", label: "Thuốc nổ NTLĐ-2", unit: "kg", unitPrice: 38.25 },
  { id: "KT14", label: "Kíp mìn", unit: "cái", unitPrice: 13.916 },
  { id: "KT15", label: "Dây mồi", unit: "mét", unitPrice: 1.013 },
  { id: "KT16", label: "Choòng khoán than", unit: "cái", unitPrice: 329.301 },
  { id: "KT17", label: "Mũi khoán than", unit: "cái", unitPrice: 191.658 },
  { id: "KT18", label: "Choòng khoán khi ép", unit: "cái", unitPrice: 486.167 },
  { id: "KT19", label: "Mũi khoán khi ép", unit: "cái", unitPrice: 260.0 },
  { id: "KT20", label: "Đất búa mìn", unit: "m²", unitPrice: 585.846 },
  { id: "KT21", label: "Dây thép buộc Ф2, Ф3", unit: "kg", unitPrice: 21.925 },
  { id: "KT22", label: "Lưới thép", unit: "m²", unitPrice: 42.415 },
  { id: "KT23", label: "Cột giả thủy lực", unit: "cột", unitPrice: 9150.0 },
  { id: "KT24", label: "Dầu nhờn hóa", unit: "lít", unitPrice: 69.76 },
  { id: "KT25", label: "Xẻng xúc than", unit: "cái", unitPrice: 51.0 },
  { id: "KT26", label: "Cuốc chà nhọn 2 đầu", unit: "cái", unitPrice: 82.0 },
  { id: "KT27", label: "Choòng phòng than", unit: "cái", unitPrice: 72.846 },
  {
    id: "KT28",
    label: "Túi ba lô đựng thuốc mìn",
    unit: "cái",
    unitPrice: 203.671,
  },
  { id: "KT29", label: "Hòm đựng thuốc kíp", unit: "cái", unitPrice: 1907.99 },
  {
    id: "KT30",
    label: "Cáp thép buộc đầu cột Ф7-8",
    unit: "m",
    unitPrice: 12.0,
  },
];
// --- End Data ---

// Kiểu dữ liệu cho các giá trị nhập liệu cho mỗi vật tư (cho 3 phần: Kế hoạch, Thực hiện, So sánh)
type MaterialValues = {
  [materialId: string]: { [key: string]: string | number };
};

// Định nghĩa tên trường input
const INPUT_FIELDS = [
  "keHoach_DM",
  "keHoach_SoLuong",
  "keHoach_GiaTri", // Tự tính
  "thucHien_SoLuong",
  "thucHien_GiaTri", // Tự tính
  "soSanh_SoLuong", // Tự tính
  "soSanh_GiaTri", // Tự tính
];

const calculateValue = (
  material: MaterialItem,
  count: string | number,
): number => {
  const numCount = parseFloat(String(count));
  if (isNaN(numCount) || numCount <= 0) return 0;
  return Math.round(numCount * material.unitPrice * 1000) / 1000; // Làm tròn 3 chữ số thập phân
};

export default function ProductionPhaseReport() {
  // Khởi tạo state
  const initialValues: MaterialValues = MATERIAL_CONSUMPTION.reduce(
    (acc: MaterialValues, item) => {
      acc[item.id] = {};
      INPUT_FIELDS.forEach((field) => (acc[item.id][field] = ""));
      return acc;
    },
    {} as MaterialValues,
  );

  const [inputValues, setInputValues] = useState<MaterialValues>(initialValues);
  const INPUT_WIDTH = "70px";

  const handleInputChange = (id: string, fieldName: string, value: string) => {
    const material = MATERIAL_CONSUMPTION.find((m) => m.id === id);
    if (!material) return;

    const numericValue = value === "" ? "" : parseFloat(value);
    let updatedValues = { ...inputValues[id], [fieldName]: numericValue };

    // --- Logic TÍNH TOÁN (Client-side cho Thành tiền) ---
    if (fieldName === "keHoach_SoLuong" || fieldName === "keHoach_DM") {
      const soLuong = updatedValues.keHoach_SoLuong || 0;
      updatedValues.keHoach_GiaTri = calculateValue(material, soLuong);
    }
    if (fieldName === "thucHien_SoLuong") {
      const soLuong = updatedValues.thucHien_SoLuong || 0;
      updatedValues.thucHien_GiaTri = calculateValue(material, soLuong);

      // Tính So sánh Số lượng (Thực hiện - Kế hoạch)
      const soLuongKeHoach = updatedValues.keHoach_SoLuong || 0;
      if (soLuongKeHoach !== "") {
        updatedValues.soSanh_SoLuong =
          (soLuong as number) - (soLuongKeHoach as number);
      }
      // Tính So sánh Giá trị (Giá trị Thực hiện - Giá trị Kế hoạch)
      const giaTriKeHoach = updatedValues.keHoach_GiaTri || 0;
      const giaTriThucHien = updatedValues.thucHien_GiaTri || 0;
      if (giaTriKeHoach !== "") {
        updatedValues.soSanh_GiaTri =
          (giaTriThucHien as number) - (giaTriKeHoach as number);
      }
    }
    // --- Kết thúc Logic TÍNH TOÁN ---

    setInputValues((prev) => ({
      ...prev,
      [id]: updatedValues,
    }));
  };

  const handleExport = () => {
    alert("Xuất file Excel cho Báo cáo vật tư tiêu hao.");
  };

  const handleSubmit = () => {
    const dataToSave = Object.keys(inputValues).map((id) => ({
      materialId: id,
      ...inputValues[id],
    }));
    console.log("Dữ liệu gửi lên server:", dataToSave);
    alert("Đã lưu dữ liệu vật tư tiêu hao.");
  };

  const getCellValue = (id: string, field: string) => {
    const value = inputValues[id]?.[field];
    // Trả về số đã làm tròn hoặc chuỗi rỗng
    return typeof value === "number" ? value.toLocaleString() : value;
  };

  return (
    <Paper sx={{ p: 3, width: "100%", boxSizing: "border-box" }}>
      <Button
        variant="contained"
        onClick={handleExport}
        startIcon={<FileDownloadIcon />}
        sx={{ mb: 2 }}
      >
        Xuất file Excel
      </Button>
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ textAlign: "center", mb: 1 }}
      >
        BÁO CÁO CÔNG ĐOẠN SẢN XUẤT
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          overflowX: "auto",
          border: "1px solid #e0e0e0",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#ccc", borderRadius: 8 },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            {/* Hàng tiêu đề 1 */}
            <TableRow sx={{ backgroundColor: "#e0f0ff" }}>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Mã giao khoán
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ minWidth: 300, border: "1px solid #a8a8a4ff" }}
              >
                Tên vật tư, tài sản
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                ĐVT
              </TableCell>
              <TableCell
                rowSpan={3}
                align="center"
                sx={{ minWidth: 100, border: "1px solid #a8a8a4ff" }}
              >
                Đơn giá (VNĐ)
              </TableCell>

              <TableCell
                colSpan={9}
                align="center"
                sx={{ minWidth: 100, border: "1px solid #a8a8a4ff" }}
              >
                Khấu lò chợ ZH, ZRY
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Khối lượng
              </TableCell>
              <TableCell
                colSpan={3}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Kế hoạch
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Thực hiện
              </TableCell>
              <TableCell
                colSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                So sánh
              </TableCell>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{ border: "1px solid #a8a8a4ff" }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
            {/* Hàng tiêu đề 2 */}
            <TableRow sx={{ backgroundColor: "#e0f0ff" }}>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                ĐM
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Số lượng
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #a8a8a4ff" }}>
                Giá trị
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MATERIAL_CONSUMPTION.map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", border: "1px solid #a8a8a4ff" }}
                >
                  {row.id}
                </TableCell>
                <TableCell sx={{ border: "1px solid #a8a8a4ff" }}>
                  {row.label}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #a8a8a4ff" }}
                >
                  {row.unit}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", border: "1px solid #a8a8a4ff" }}
                >
                  {row.unitPrice.toLocaleString("vi-VN")}
                </TableCell>

                {/* 1. Kế hoạch */}
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #a8a8a4ff" }}
                >
                  {/* <TextField
                                        size="small" variant="outlined" sx={{ width: INPUT_WIDTH }} type="number"
                                        value={getCellValue(row.id, 'keHoach_DM')}
                                        onChange={(e) => handleInputChange(row.id, 'keHoach_DM', e.target.value)}
                                        inputProps={{ style: { padding: '5px 8px', textAlign: 'center' } }}
                                    /> */}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #a8a8a4ff" }}
                >
                  {/* <TextField
                                        size="small" variant="outlined" sx={{ width: INPUT_WIDTH }} type="number"
                                        value={getCellValue(row.id, 'keHoach_SoLuong')}
                                        onChange={(e) => handleInputChange(row.id, 'keHoach_SoLuong', e.target.value)}
                                        inputProps={{ style: { padding: '5px 8px', textAlign: 'center' } }}
                                    /> */}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "blue",
                    border: "1px solid #a8a8a4ff",
                  }}
                >
                  {getCellValue(row.id, "keHoach_GiaTri")}
                </TableCell>

                {/* 2. Thực hiện */}
                <TableCell
                  align="center"
                  sx={{ border: "1px solid #a8a8a4ff" }}
                >
                  {/* <TextField
                                        size="small" variant="outlined" sx={{ width: INPUT_WIDTH }} type="number"
                                        value={getCellValue(row.id, 'thucHien_SoLuong')}
                                        onChange={(e) => handleInputChange(row.id, 'thucHien_SoLuong', e.target.value)}
                                        inputProps={{ style: { padding: '5px 8px', textAlign: 'center' } }}
                                    /> */}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "green",
                    border: "1px solid #a8a8a4ff",
                  }}
                >
                  {getCellValue(row.id, "thucHien_GiaTri")}
                </TableCell>

                {/* 3. So sánh (Chỉ hiển thị) */}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "orange",
                    border: "1px solid #a8a8a4ff",
                  }}
                >
                  {getCellValue(row.id, "soSanh_SoLuong")}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "red",
                    border: "1px solid #a8a8a4ff",
                  }}
                >
                  {getCellValue(row.id, "soSanh_GiaTri")}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "red",
                    border: "1px solid #a8a8a4ff",
                  }}
                ></TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    color: "red",
                    border: "1px solid #a8a8a4ff",
                  }}
                ></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
