import * as XLSX from "xlsx";

export const readExcelFile = (file: File) => {
    return new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
                const worksheet = workbook.Sheets[sheetName];

                // Chuyển đổi thành JSON (chọn header: 1 để lấy mảng của mảng)
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

