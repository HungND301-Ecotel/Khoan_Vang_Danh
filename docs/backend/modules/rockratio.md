# RockRatio Module

## Mô tả nghiệp vụ
Tỷ lệ đá trong vỉa than - ảnh hưởng đến hệ số điều chỉnh.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên tỷ lệ đá |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/rockratios` | Tạo |
| PUT | `/api/rockratios/:id` | Cập nhật |
| DELETE | `/api/rockratios/:id` | Xóa |
| GET | `/api/rockratios` | Danh sách |
| POST | `/api/rockratios/import` | Import Excel |
| GET | `/api/rockratios/export` | Export Excel |

## Relationships
- Referenced by: AdjustmentNorm
