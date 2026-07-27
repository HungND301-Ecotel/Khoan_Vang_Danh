# SystemConfig Module

## Mô tả nghiệp vụ
Quản lý cấu hình hệ thống. Lưu trữ các giá trị cấu hình key-value.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| key | String | ✓ | ✓ | Khóa cấu hình |
| value | String | ✓ | - | Giá trị |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/system-configs` | Lấy tất cả cấu hình |
| PUT | `/api/system-configs/:id` | Cập nhật cấu hình |

## Seeded Configs

| Key | Value | Mô tả |
|-----|-------|--------|
| DL | - | Mã nhóm công đoạn đào lò |
| KT | - | Mã nhóm công đoạn khai thác |
| XL | - | Mã nhóm công đoạn xẻ lò |
| MAX_TABS_PER_USER | 7 | Số tab tối đa mỗi user |

## Business Logic
- CRUD đơn giản cho cấu hình hệ thống
- Không có validation đặc biệt
