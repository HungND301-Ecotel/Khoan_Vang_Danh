# ProductionScope Module

## Mô tả nghiệp vụ
Phạm vi/khu vực sản xuất trong mỏ than.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã phạm vi |
| name | String | ✓ | ✓ | Tên phạm vi |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/productionscopes` | Tạo phạm vi |
| PUT | `/api/productionscopes/:id` | Cập nhật |
| DELETE | `/api/productionscopes/:id` | Xóa |
| GET | `/api/productionscopes` | Danh sách |
| POST | `/api/productionscopes/import` | Import Excel |
| GET | `/api/productionscopes/export` | Export Excel |

## Relationships
- Referenced by: InitialPlannedCost, MaterialBudget, MaterialCostUsed
