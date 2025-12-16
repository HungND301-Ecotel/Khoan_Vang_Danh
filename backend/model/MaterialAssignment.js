const mongoose = require('mongoose')

const MaterialAssignment = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'MaterialAssignment name is required'],
        unique: true
    },
    uom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    assignmentCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssignmentCode'
    },
    quantity: {
        type: Number
    },
    priceHistory: [{
        price: Number,
        month: String,
        startDate: String,
        endDate: String
    }],
}, {
    timestamps: true
})

MaterialAssignment.pre('save', async function (next) {
    const priceHistory = this.priceHistory;

    try {
        if (priceHistory && priceHistory.length > 0) {
            // 1. Kiểm tra trùng lặp trong dữ liệu gửi lên (data mới)
            const monthSet = new Set();
            for (const item of priceHistory) {
                if (item.month) {
                    if (monthSet.has(item.month)) {
                        // Trùng lặp trong dữ liệu mới
                        return next(new Error(`Tháng ${item.month} đã được thêm vào nhiều lần trong lịch sử đơn giá.`));
                    }
                    monthSet.add(item.month);
                }
            }

            // 2. Kiểm tra trùng lặp với dữ liệu đã tồn tại trong database (nếu là update)
            // Chỉ cần thực hiện bước này nếu tài liệu đã tồn tại (là update, không phải create mới)
            if (this.isModified('priceHistory') && !this.isNew) {
                // Lấy tài liệu gốc từ database
                const existingDoc = await mongoose.models.MaterialAssignment.findById(this._id);

                if (existingDoc) {
                    const existingMonths = existingDoc.priceHistory.map(item => item.month);

                    // So sánh các tháng mới được thêm/sửa với các tháng đã tồn tại
                    for (const newItem of priceHistory) {
                        if (newItem.month) {
                            // Kiểm tra xem tháng mới có bị trùng với tháng đã có trong DB hay không
                            // (Trừ trường hợp chính mục đó đang được sửa)
                            const isDuplicate = existingMonths.some(existingMonth =>
                                existingMonth === newItem.month &&
                                // Logic phức tạp hơn nếu cần check ID, nhưng ở đây ta chỉ cần check tháng
                                !this.priceHistory.some(oldItem => oldItem.month === existingMonth)
                            );

                            if (isDuplicate) {
                                // Trùng lặp với dữ liệu đã tồn tại
                                return next(new Error(`Tháng ${newItem.month} đã tồn tại trong lịch sử đơn giá của vật tư này.`));
                            }
                        }
                    }
                }
            }
        }

        next();
    } catch (error) {
        // Xử lý lỗi trong quá trình truy vấn
        next(error);
    }
});

MaterialAssignment.pre('findOneAndUpdate', async function (next) {
    // 'this' là đối tượng Query. Cần dùng this.getUpdate() để lấy dữ liệu cập nhật
    const update = this.getUpdate();

    // Kiểm tra xem priceHistory có được cập nhật hay không
    if (update.priceHistory) {
        const priceHistory = update.priceHistory;

        // --- LOGIC KIỂM TRA TRÙNG LẶP (Tương tự như trong pre('save')) ---
        const monthSet = new Set();
        for (const item of priceHistory) {
            if (item.month) {
                if (monthSet.has(item.month)) {
                    return next(new Error(`Tháng ${item.month} bị lặp lại.`));
                }
                monthSet.add(item.month);
            }
        }
    }

    next();
});
module.exports = mongoose.model('MaterialAssignment', MaterialAssignment)