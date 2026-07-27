# Thickness Module

## Mô tả nghiệp vụ
Độ dày vỉa than - tham số kỹ thuật quan trọng.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên độ dày |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/thickness` | Tạo |
| PUT | `/api/thickness/:id` | Cập nhật |
| DELETE | `/api/thickness/:id` | Xóa |
| GET | `/api/thickness` | Danh sách |
| POST | `/api/thickness/import` | Import Excel |
| GET | `/api/thickness/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm
