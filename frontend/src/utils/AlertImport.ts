import { showSuccessAlert } from "../components/Alert";

export function ShowAlertImport(data: any) {
    let combinedMessage = `Import dữ liệu hoàn tất. Đã xử lý ${data.summary.totalProcessed} bản ghi.`;
    combinedMessage += `\nĐã thêm mới: ${data.summary.insertedCount}`;
    combinedMessage += `\nĐã cập nhật: ${data.summary.updatedCount}`;
    combinedMessage += `\nĐã xóa: ${data.summary.deletedCount}`;

    // Thêm chi tiết lỗi nếu có
    if (data.invalidRows && data.invalidRows.length > 0) {
        combinedMessage += `\n\n--- CÓ LỖI XẢY RA TRONG QUÁ TRÌNH IMPORT ---`;
        combinedMessage += `\n${data.invalidRows.length} bản ghi không hợp lệ:`;

        // Liệt kê chi tiết một vài lỗi đầu tiên
        data.invalidRows.slice(0, 5).forEach((item: any, index: number) => {
            combinedMessage += `\n- Dòng ${index + 1}: Lỗi "${item.error}"`;
        });

        // Thông báo nếu còn nhiều lỗi hơn
        if (data.invalidRows.length > 5) {
            combinedMessage += `\n... và ${data.invalidRows.length - 5} lỗi khác.`;
        }
    }
    return showSuccessAlert(combinedMessage);
}