# MiningTech Module

## Mô tả nghiệp vụ
Mã công nghệ khai thác.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã công nghệ |
| name | String | ✓ | ✓ | Tên công nghệ |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/miningtechs` | Tạo |
| PUT | `/api/miningtechs/:id` | Cập nhật |
| DELETE | `/api/miningtechs/:id` | Xóa |
| GET | `/api/miningtechs` | Danh sách |
| POST | `/api/miningtechs/import` | Import Excel |
| GET | `/api/miningtechs/export` | Export Excel |

## Relationships
- Không có tham chiếu trực tiếp trong các module khác
