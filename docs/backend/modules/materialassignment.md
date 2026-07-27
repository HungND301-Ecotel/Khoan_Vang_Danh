# MaterialAssignment Module

## Mô tả nghiệp vụ
Quản lý định mức vật tư cho từng mã công việc. Mỗi vật tư có lịch sử giá theo thời gian (priceHistory).

## Model Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| code | String | ✓ | Mã vật tư |
| name | String | ✓ | Tên vật tư |
| uom | ObjectId (Unit) | ✓ | Đơn vị tính |
| assignmentCode | ObjectId (AssignmentCode) | ✓ | Mã công việc cha |
| quantity | Number | ✓ | Số lượng |
| priceHistory | Array | ✓ | Lịch sử giá |

### priceHistory Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| price | Number | ✓ | Đơn giá |
| startMonth | String | ✓ | Tháng bắt đầu (YYYY-MM) |
| endMonth | String | ✓ | Tháng kết thúc (YYYY-MM) |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/materialassignments` | Tạo vật tư |
| PUT | `/api/materialassignments/:id` | Cập nhật |
| DELETE | `/api/materialassignments/:id` | Xóa |
| GET | `/api/materialassignments` | Danh sách (phân trang) |
| GET | `/api/materialassignments/group` | Nhóm theo AssignmentCode |
| GET | `/api/materialassignments/count` | Thống kê số lượng |
| POST | `/api/materialassignments/import` | Import từ Excel |
| GET | `/api/materialassignments/export` | Export ra Excel |

## Business Logic

### priceHistory Validation
- `startMonth` phải <= `endMonth`
- Không được có khoảng thời gian trùng lặp cho cùng một vật tư
- Pre-save và pre-findOneAndUpdate hooks enforce các ràng buộc này

### getGroup Endpoint
Trả về AssignmentCodes với các vật tư con, mỗi vật tư có giá hiện tại được resolve từ priceHistory theo tháng query.

### Import
- Hỗ trợ composite key matching: `code|assignmentCodeId` cho upsert
- Validation foreign keys (Unit, AssignmentCode)

## Relationships
- References: Unit, AssignmentCode
- Được sử dụng để tính giá trung bình có trọng số cho AssignmentCode
