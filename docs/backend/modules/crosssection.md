# CrossSection Module

## Mô tả nghiệp vụ
Tiết diện lò (kích thước mặt cắt ngang đường lò).

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên tiết diện |
| uom | ObjectId (Unit) | ✓ | - | Đơn vị tính |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/crosssections` | Tạo |
| PUT | `/api/crosssections/:id` | Cập nhật |
| DELETE | `/api/crosssections/:id` | Xóa |
| GET | `/api/crosssections` | Danh sách |
| POST | `/api/crosssections/import` | Import Excel |
| GET | `/api/crosssections/export` | Export Excel |

## Relationships
- References: Unit
- Referenced by: AssignmentNorm
