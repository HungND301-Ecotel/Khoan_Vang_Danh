# MaterialBudget Module

## Mô tả nghiệp vụ
Ngân sách vật tư - được tính tự động từ InitialPlannedCost. Đại diện cho kế hoạch chi phí dựa trên sản lượng và định mức.

## Model Schema

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| productionScope | ObjectId | ✓ | Phạm vi sản xuất |
| department | ObjectId | ✓ | Phòng ban |
| month | String | ✓ | Tháng (YYYY-MM) |
| phase | ObjectId | ✓ | Công đoạn |
| production | Number | ✓ | Sản lượng |
| unit | ObjectId | ✓ | Đơn vị tính |
| assignmentNormCode | ObjectId | ✓ | Mã định mức sản xuất |
| adjustmentNormCode | ObjectId | ✓ | Mã hệ số điều chỉnh |
| budgetCostDetails | Array | ✓ | Chi tiết ngân sách |
| totalBudgetCost | Number | ✓ | Tổng ngân sách |

### budgetCostDetails Schema

| Field | Type | Mô tả |
|-------|------|--------|
| assignmentCode | ObjectId | Mã công việc |
| baseNorm | Number | Định mức cơ sở |
| adjustmentNorm | Number | Hệ số điều chỉnh |
| norm | Number | Định mức hiệu chỉnh |
| quantity | Number | Số lượng |
| price | Number | Đơn giá |
| cost | Number | Thành tiền |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/materialbudgets/level/0` | Level 0: Danh sách phòng ban |
| GET | `/api/materialbudgets/level/1` | Level 1: Danh sách tháng |
| GET | `/api/materialbudgets/level/2` | Level 2: Phạm vi sản xuất |
| GET | `/api/materialbudgets/level/3` | Level 3: Công đoạn |
| GET | `/api/materialbudgets/:id` | Chi tiết (tính giá hiện tại) |

## Business Logic

### getOne Endpoint
Khi lấy chi tiết, hệ thống tính lại giá hiện tại cho vật tư và priceHistory của chúng.

### Auto-sync
- Được tạo/cập nhật tự động khi InitialPlannedCost thay đổi
- Được tạo/cập nhật tự động khi MaterialCostUsed thay đổi (với production=0 để reset)

## Relationships
- References: ProductionScope, Department, Phase, Unit, AssignmentNorm, AdjustmentNorm, AssignmentCode
- Được tạo bởi: InitialPlannedCost, MaterialCostUsed
