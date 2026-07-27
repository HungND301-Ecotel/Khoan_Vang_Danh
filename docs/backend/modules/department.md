# Department Module

## Mô tả nghiệp vụ
Quản lý phòng ban / phân xưởng trong công ty khai thác than.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã phòng ban |
| name | String | ✓ | ✓ | Tên phòng ban |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/departments` | Tạo phòng ban |
| PUT | `/api/departments/:id` | Cập nhật |
| DELETE | `/api/departments/:id` | Xóa |
| GET | `/api/departments` | Danh sách (phân trang) |
| POST | `/api/departments/import` | Import từ Excel |
| GET | `/api/departments/export` | Export ra Excel |

## Business Logic
- CRUD đơn giản
- Import/Export Excel
- Code và name phải unique

## Relationships
- Được tham chiếu bởi: InitialPlannedCost, MaterialBudget, MaterialCostUsed, OtherMaterialCost
