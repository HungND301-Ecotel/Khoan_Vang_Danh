# Length Module

## Mô tả nghiệp vụ
Chiều dài - tham số kỹ thuật cho định mức.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên chiều dài |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/length` | Tạo |
| PUT | `/api/length/:id` | Cập nhật |
| DELETE | `/api/length/:id` | Xóa |
| GET | `/api/length` | Danh sách |
| POST | `/api/length/import` | Import Excel |
| GET | `/api/length/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm
