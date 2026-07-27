# PhaseGroup Module

## Mô tả nghiệp vụ
Nhóm công đoạn cao nhất - phân loại công việc thành 3 nhóm chính: Đào lò, Xẻ lò, Khai thác than.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã nhóm |
| name | String | ✓ | ✓ | Tên nhóm |

## Seeded Data

| Code | Name |
|------|------|
| DL | Đào lò |
| XL | Xẻ lò |
| KT | Khai thác than |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/phasegroups` | Tạo nhóm |
| PUT | `/api/phasegroups/:id` | Cập nhật |
| DELETE | `/api/phasegroups/:id` | Xóa |
| GET | `/api/phasegroups` | Danh sách |
| POST | `/api/phasegroups/import` | Import Excel |
| GET | `/api/phasegroups/export` | Export Excel |

## Relationships
- Referenced by: Phase, AssignmentNorm, InitialPlannedCost
