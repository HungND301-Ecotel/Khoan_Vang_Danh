# InitialPlannedCost Module

## Mô tả nghiệp vụ
**MODULE PHỨC TẠP NHẤT** - Quản lý chi phí kế hoạch ban đầu. Tính toán tự động chi phí dựa trên sản lượng mục tiêu, định mức và giá vật tư.

## Model Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| productionScope | ObjectId | ✓ | Phạm vi sản xuất |
| department | ObjectId | ✓ | Phòng ban |
| month | String | ✓ | Tháng (YYYY-MM) |
| phase | ObjectId | ✓ | Công đoạn |
| production | Number | ✓ | Sản lượng mục tiêu |
| unit | ObjectId | ✓ | Đơn vị tính |
| assignmentNormCode | ObjectId | ✓ | Mã định mức sản xuất |
| adjustmentNormCode | ObjectId | ✓ | Mã hệ số điều chỉnh |
| initialPlannedCostDetails | Array | ✓ | Chi tiết chi phí |
| totalInitialPlannedCost | Number | ✓ | Tổng chi phí kế hoạch |

### initialPlannedCostDetails Schema

| Field | Type | Mô tả |
|-------|------|--------|
| assignmentCode | ObjectId | Mã công việc |
| baseNorm | Number | Định mức cơ sở |
| adjustmentNorm | Number | Hệ số điều chỉnh |
| norm | Number | Định mức hiệu chỉnh (base × adjustment) |
| quantity | Number | Số lượng (norm × production) |
| price | Number | Đơn giá (weighted average) |
| cost | Number | Thành tiền (price × quantity) |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/initialplannedcosts` | Tạo chi phí (single) |
| POST | `/api/initialplannedcosts/batch` | Tạo chi phí (batch) |
| PUT | `/api/initialplannedcosts/:id` | Cập nhật |
| DELETE | `/api/initialplannedcosts/:id` | Xóa |
| DELETE | `/api/initialplannedcosts/department` | Xóa theo phòng ban |
| GET | `/api/initialplannedcosts/level/0` | Level 0: Danh sách phòng ban |
| GET | `/api/initialplannedcosts/level/1` | Level 1: Danh sách tháng |
| GET | `/api/initialplannedcosts/level/2` | Level 2: Phạm vi sản xuất |
| GET | `/api/initialplannedcosts/level/3` | Level 3: Công đoạn |

## Business Logic

### Tính toán chi phí (`calculatedPhase`)
```
effectiveNorm = baseNorm × adjustmentNorm
quantity = effectiveNorm × production (÷ 1000 cho loại than)
price = weighted average từ MaterialAssignment
cost = price × quantity
```

### Đồng bộ dữ liệu (`syncRelatedData`)
Khi lưu InitialPlannedCost, hệ thống tự động:
1. Refresh giá MaterialCostUsed từ priceHistory hiện tại
2. Tính lại MaterialBudget từ dữ liệu InitialPlannedCost

### Xóa cascade
- Xóa InitialPlannedCost → xóa luôn MaterialCostUsed và MaterialBudget liên quan
- `deleteByDepartment`: Xóa bulk theo phòng ban với transaction rollback

### Multi-level GET
Hệ thống phân cấp dữ liệu:
- Level 0: Liệt kê phòng ban
- Level 1: Liệt kê tháng trong phòng ban
- Level 2: Liệt kê phạm vi sản xuất trong tháng
- Level 3: Liệt kê công đoạn trong phạm vi

## Relationships
- References: ProductionScope, Department, Phase, Unit, AssignmentNorm, AdjustmentNorm, AssignmentCode
- Tạo ra: MaterialCostUsed, MaterialBudget
