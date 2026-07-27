# AdjustmentNorm Module

## Mô tả nghiệp vụ
Hệ số điều chỉnh định mức. Điều chỉnh định mức sản xuất theo điều kiện địa chất (độ cứng, tỷ lệ đá, tỷ lệ than mềm).

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã hệ số |
| hardness | ObjectId (Hardness) | - | - | Độ cứng đá |
| rockRatio | ObjectId (RockRatio) | - | - | Tỷ lệ đá |
| mirrorRatio | ObjectId (MirrorRatio) | - | - | Tỷ lệ than mềm |
| type | String | ✓ | - | Loại (CM/CKKT/CKDL) |
| norms | Array | ✓ | - | Chi tiết hệ số |

### Adjustment Types
- **CM**: Hệ số điều chỉnh chính
- **CKKT**: Hệ số điều chỉnh kỹ thuật
- **CKDL**: Hệ số điều chỉnh địa lý

### norms Schema

| Field | Type | Mô tả |
|-------|------|--------|
| assignmentCode | ObjectId | Mã công việc |
| norm | Number | Hệ số điều chỉnh |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/adjustmentnorms` | Tạo hệ số |
| PUT | `/api/adjustmentnorms/:id` | Cập nhật |
| DELETE | `/api/adjustmentnorms/:id` | Xóa |
| GET | `/api/adjustmentnorms` | Danh sách (phân trang) |
| POST | `/api/adjustmentnorms/import` | Import từ Excel (matrix format) |
| GET | `/api/adjustmentnorms/export` | Export ra Excel (matrix format) |

## Business Logic

### Import/Export Matrix Format
Tương tự AssignmentNorm - sử dụng matrix format cho import/export.

## Relationships
- References: Hardness, RockRatio, MirrorRatio, AssignmentCode
- Referenced by: InitialPlannedCost, MaterialBudget
