# Unit Module

## Mô tả nghiệp vụ
Đơn vị tính (tấn, mét, khối, etc.)

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên đơn vị |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/units` | Tạo đơn vị |
| PUT | `/api/units/:id` | Cập nhật |
| DELETE | `/api/units/:id` | Xóa |
| GET | `/api/units` | Danh sách |

## Relationships
- Referenced by: AssignmentCode, CrossSection, MaterialAssignment, InitialPlannedCost, MaterialBudget, MaterialCostUsed
