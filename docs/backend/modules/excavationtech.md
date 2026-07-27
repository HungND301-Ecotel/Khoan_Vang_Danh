# ExcavationTech Module

## Mô tả nghiệp vụ
Loại công nghệ đào lò (phương pháp thi công).

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| name | String | ✓ | ✓ | Tên công nghệ |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/excavationtechs` | Tạo công nghệ |
| PUT | `/api/excavationtechs/:id` | Cập nhật |
| DELETE | `/api/excavationtechs/:id` | Xóa |
| GET | `/api/excavationtechs` | Danh sách |
| POST | `/api/excavationtechs/import` | Import Excel |
| GET | `/api/excavationtechs/export` | Export Excel |

## Relationships
- Referenced by: AssignmentNorm
