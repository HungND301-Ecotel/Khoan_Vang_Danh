# OtherMaterialCost Module

## Mô tả nghiệp vụ
Quản lý chi phí vật tư ngoài hệ thống định mức hợp đồng. Dành cho các chi phí không nằm trong quy chuẩn thông thường.

## Model Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| department | ObjectId | ✓ | Phòng ban |
| month | String | ✓ | Tháng (YYYY-MM) |
| totalUsedCost | Number | ✓ | Tổng chi phí |
| materials | Array | ✓ | Chi tiết vật tư |

### materials Schema

| Field | Type | Mô tả |
|-------|------|--------|
| material | ObjectId | Vật tư |
| quantity | Number | Số lượng |
| price | Number | Đơn giá |
| cost | Number | Thành tiền |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/othermaterialcosts` | Tạo chi phí |
| PUT | `/api/othermaterialcosts/:id` | Cập nhật |
| DELETE | `/api/othermaterialcosts/:id` | Xóa |
| GET | `/api/othermaterialcosts` | Danh sách (phân trang) |

## Business Logic

### Price Resolution
Cùng logic với MaterialCostUsed:
1. Nếu có `assignmentCode` → weighted average price
2. Nếu không → lookup từ `priceHistory` theo tháng

### Constraint
- Chỉ cho phép 1 bản ghi OtherMaterialCost per phòng ban per tháng

## Relationships
- References: Department, MaterialAssignment, AssignmentCode
- Được kết hợp với MaterialCostUsed trong aggregation queries
