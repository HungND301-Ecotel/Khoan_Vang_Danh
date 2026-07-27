# CurbSlope Module

## Mô tả nghiệp vụ
Độ dốc vỉa than - tham số kỹ thuật ảnh hưởng đến định mức.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên độ dốc |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/curbslopes` | Tạo |
| PUT | `/api/curbslopes/:id` | Cập nhật |
| DELETE | `/api/curbslopes/:id` | Xóa |
| GET | `/api/curbslopes` | Danh sách |
| POST | `/api/curbslopes/import` | Import Excel |
| GET | `/api/curbslopes/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm
