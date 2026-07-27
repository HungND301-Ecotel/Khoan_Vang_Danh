# Step Module

## Mô tả nghiệp vụ
Bước chống giữ - tham số kỹ thuật cho công tác chống lò.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên bước chống |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/steps` | Tạo |
| PUT | `/api/steps/:id` | Cập nhật |
| DELETE | `/api/steps/:id` | Xóa |
| GET | `/api/steps` | Danh sách |
| POST | `/api/steps/import` | Import Excel |
| GET | `/api/steps/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm
