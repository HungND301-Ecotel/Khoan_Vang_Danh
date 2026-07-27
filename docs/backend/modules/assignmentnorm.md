# AssignmentNorm Module

## Mô tả nghiệp vụ
Định mức sản xuất cơ sở cho các công việc. Xác định lượng vật tư cần thiết cho mỗi đơn vị sản xuất, thay đổi theo điều kiện kỹ thuật.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã định mức |
| phaseGroup | ObjectId (PhaseGroup) | - | - | Nhóm công đoạn |
| phase | ObjectId (Phase) | - | - | Công đoạn |
| excavationTech | ObjectId (ExcavationTech) | - | - | Công nghệ đào |
| step | ObjectId (Step) | - | - | Bước chống |
| length | ObjectId (Length) | - | - | Chiều dài |
| crossSection | ObjectId (CrossSection) | - | - | Tiết diện |
| curbSlope | ObjectId (CurbSlope) | - | - | Độ dốc |
| hardness | ObjectId (Hardness) | - | - | Độ cứng |
| thickness | ObjectId (Thickness) | - | - | Độ dày |
| type | String | ✓ | - | Loại (cutting/excavation/coal_kb/coal_zh/coal_zry) |
| norms | Array | ✓ | - | Chi tiết định mức |

### norms Schema

| Field | Type | Mô tả |
|-------|------|--------|
| assignmentCode | ObjectId | Mã công việc |
| norm | Number | Định mức (lượng vật tư/đơn vị sản xuất) |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/assignmentnorms` | Tạo định mức |
| PUT | `/api/assignmentnorms/:id` | Cập nhật |
| DELETE | `/api/assignmentnorms/:id` | Xóa |
| GET | `/api/assignmentnorms` | Danh sách (phân trang) |
| POST | `/api/assignmentnorms/import` | Import từ Excel (matrix format) |
| GET | `/api/assignmentnorms/export` | Export ra Excel (matrix format) |

## Business Logic

### Import/Export Matrix Format
- Export tạo Excel matrix: columns = các bản ghi định mức, rows = thuộc tính (Phase, ExcavationTech, etc.) + AssignmentCode ở dưới
- Import đọc matrix format, ánh xｬ giá trị column sang FK lookup

## Relationships
- References: PhaseGroup, Phase, ExcavationTech, Step, Length, CrossSection, CurbSlope, Hardness, Thickness, AssignmentCode
- Referenced by: InitialPlannedCost, MaterialBudget
