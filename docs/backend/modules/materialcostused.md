# MaterialCostUsed Module

## Mô tả nghiệp vụ
Quản lý chi phí vật tư thực tế đã sử dụng. Ghi nhận lượng vật tư tiêu thụ thực tế và tự động cập nhật ngân sách.

## Model Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| productionScope | ObjectId | ✓ | Phạm vi sản xuất |
| department | ObjectId | ✓ | Phòng ban |
| month | String | ✓ | Tháng (YYYY-MM) |
| phase | ObjectId | ✓ | Công đoạn |
| production | Number | ✓ | Sản lượng thực tế |
| unit | ObjectId | ✓ | Đơn vị tính |
| totalUsedCost | Number | ✓ | Tổng chi phí thực tế |
| materials | Array | ✓ | Chi tiết vật tư |

### materials Schema

| Field | Type | Mô tả |
|-------|------|--------|
| material | ObjectId | Vật tư (ref MaterialAssignment) |
| assignmentCode | ObjectId | Mã công việc |
| quantity | Number | Số lượng thực tế |
| price | Number | Đơn giá |
| cost | Number | Thành tiền (price × quantity) |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/materialcostuseds` | Tạo chi phí (single) |
| POST | `/api/materialcostuseds/batch` | Tạo chi phí (batch) |
| PUT | `/api/materialcostuseds/:id` | Cập nhật (single) |
| PUT | `/api/materialcostuseds/batch` | Cập nhật (batch) |
| DELETE | `/api/materialcostuseds/:id` | Xóa |
| DELETE | `/api/materialcostuseds/department` | Xóa theo phòng ban |
| GET | `/api/materialcostuseds/level/0` | Level 0: Danh sách phòng ban |
| GET | `/api/materialcostuseds/level/1` | Level 1: Danh sách tháng |
| GET | `/api/materialcostuseds/level/2` | Level 2: Phạm vi sản xuất |
| GET | `/api/materialcostuseds/level/3` | Level 3: Công đoạn |

## Business Logic

### buildMaterials Helper
Resolve giá cho mỗi vật tư:
1. Nếu vật tư có `assignmentCode` → dùng `recalculateAssignmentCodePrice()` (weighted average)
2. Nếu không → tìm giá từ `priceHistory` theo tháng

### Auto-sync MaterialBudget
Khi lưu MaterialCostUsed, hệ thống tự động tính lại MaterialBudget bằng `calculatedPhase()`.

### Delete Cascade
- Xóa MaterialCostUsed → reset MaterialBudget (tính lại với production=0)
- `deleteByDepartment`: Xóa bulk cả MaterialCostUsed và OtherMaterialCost

### get Endpoint
Sử dụng `$unionWith` aggregation để kết hợp MaterialCostUsed và OtherMaterialCost thành một view duy nhất theo phòng ban.

## Relationships
- References: ProductionScope, Department, Phase, Unit, MaterialAssignment, AssignmentCode
- Tác động đến: MaterialBudget
