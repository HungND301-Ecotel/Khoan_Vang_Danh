// drop.js
const path = require("path");
// Trỏ ra file .env ở thư mục cha
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connect = require("../config/db");
const MaterialAssignment = require("../model/MaterialAssignment");

const dropMaterialIndex = async () => {
  try {
    await connect();

    // Lấy danh sách tất cả các index hiện có trong collection
    const indexes = await MaterialAssignment.collection.getIndexes();
    console.log("🔍 Các index hiện có:", Object.keys(indexes));

    // Kiểm tra và xóa index name_1 (đang gây lỗi trùng lặp name)
    if (indexes.name_1) {
      await MaterialAssignment.collection.dropIndex("name_1");
      console.log(
        "✅ Đã xóa index name_1 thành công. Bây giờ bạn có thể trùng name.",
      );
    } else {
      console.log("ℹ️ Không tìm thấy index name_1.");
    }

    // Tiện thể kiểm tra luôn code_1 nếu bạn vẫn muốn xóa
    if (indexes.code_1) {
      await MaterialAssignment.collection.dropIndex("code_1");
      console.log("✅ Đã xóa thêm index code_1.");
    }
  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

dropMaterialIndex();
