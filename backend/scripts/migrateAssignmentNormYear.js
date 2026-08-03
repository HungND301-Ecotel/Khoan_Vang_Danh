const AssignmentNorm = require("../model/AssignmentNorm");

const migrate = async () => {
  try {

    // Tìm các bản ghi chưa có year (hoặc year null)
    const filter = {
      $or: [{ year: { $exists: false } }, { year: null }],
    };

    const docs = await AssignmentNorm.find(filter);
    console.log(`Tìm thấy ${docs.length} bản ghi cần cập nhật`);

    if (docs.length === 0) {
      console.log("Không có bản ghi nào cần migrate.");
    }

    // Dùng updateMany trực tiếp để tránh trigger lại middleware checkOverlap
    // (vì middleware pre('save') sẽ so sánh với chính các bản ghi đang migrate, dễ gây lỗi trùng lặp giả)
    const result = await AssignmentNorm.collection.updateMany(filter, {
      $set: {
        year: 2026,
        startMonth: "2026-01",
        endMonth: "2026-12",
      },
    });

    console.log(`Đã cập nhật ${result.modifiedCount} bản ghi`);
  } catch (err) {
    console.error("Lỗi khi migrate:", err);
  }
};

migrate();
