# MirrorRatio Module

## Mô tả nghiệp vụ
Tỷ lệ than mềm (gương) - ảnh hưởng đến hệ số điều chỉnh.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên tỷ lệ than mềm |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/mirrorratios` | Tạo |
| PUT | `/api/mirrorratios/:id` | Cập nhật |
| DELETE | `/api/mirrorratios/:id` | Xóa |
| GET | `/api/mirrorratios` | Danh sách |
| POST | `/api/mirrorratios/import` | Import Excel |
| GET | `/api/mirrorratios/export` | Export Excel |

## Relationships
- Referenced by: AdjustmentNorm
