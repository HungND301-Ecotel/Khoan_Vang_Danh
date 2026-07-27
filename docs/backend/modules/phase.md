# Phase Module

## Mô tả nghiệp vụ
Công đoạn cụ thể thuộc nhóm công đoạn (PhaseGroup).

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã công đoạn |
| name | String | ✓ | ✓ | Tên công đoạn |
| phaseGroup | ObjectId (PhaseGroup) | ✓ | - | Nhóm công đoạn cha |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/phases` | Tạo công đoạn |
| PUT | `/api/phases/:id` | Cập nhật |
| DELETE | `/api/phases/:id` | Xóa |
| GET | `/api/phases` | Danh sách |
| POST | `/api/phases/import` | Import Excel |
| GET | `/api/phases/export` | Export Excel |

## Relationships
- References: PhaseGroup
- Referenced by: AssignmentNorm, InitialPlannedCost, MaterialBudget, MaterialCostUsed
