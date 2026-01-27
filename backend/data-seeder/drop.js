// drop.js
const path = require("path");
// Phải trỏ đúng ra file .env ở thư mục cha của thư mục hiện tại
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connect = require("../config/db");
const MaterialAssignment = require("../model/MaterialAssignment");

const dropMaterialIndex = async () => {
  try {
    await connect();
    // Sau khi connect thành công, log thử xem có đúng tên index code_1 không
    const indexes = await MaterialAssignment.collection.getIndexes();
    console.log("Các index hiện có:", indexes);

    if (indexes.code_1) {
      await MaterialAssignment.collection.dropIndex("code_1");
      console.log("✅ Đã xóa index code_1 thành công");
    } else {
      console.log(
        "ℹ️ Không tìm thấy index code_1, có thể nó đã bị xóa trước đó.",
      );
    }
  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

dropMaterialIndex();
