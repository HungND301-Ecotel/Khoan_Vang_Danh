# Hardness Module

## Mô tả nghiệp vụ
Mức độ cứng của đá - tham số kỹ thuật ảnh hưởng đến định mức sản xuất.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên mức độ cứng |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/hardness` | Tạo |
| PUT | `/api/hardness/:id` | Cập nhật |
| DELETE | `/api/hardness/:id` | Xóa |
| GET | `/api/hardness` | Danh sách |
| POST | `/api/hardness/import` | Import Excel |
| GET | `/api/hardness/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm, AdjustmentNorm
