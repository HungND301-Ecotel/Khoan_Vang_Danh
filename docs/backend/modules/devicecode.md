# DeviceCode Module

## Mô tả nghiệp vụ
Mã thiết bị sử dụng trong khai thác mỏ.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã thiết bị |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/devicecodes` | Tạo mã thiết bị |
| PUT | `/api/devicecodes/:id` | Cập nhật |
| DELETE | `/api/devicecodes/:id` | Xóa |
| GET | `/api/devicecodes` | Danh sách |
| POST | `/api/devicecodes/import` | Import Excel |
| GET | `/api/devicecodes/export` | Export Excel |

## Relationships
- Referenced by: AssignmentCode
