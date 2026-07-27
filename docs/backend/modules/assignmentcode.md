# AssignmentCode Module

## Mô tả nghiệp vụ
**MODULE TRỌNG TÂM** - Quản lý mã công việc (hạng mục công việc). Mỗi mã công việc đại diện cho một loại công việc trong khai thác than, có giá được tính tự động từ giá trung bình có trọng số của các vật tư liên kết.

## Model Schema

| Field | Type | Required | Unique | Mô tả |
|-------|------|----------|--------|-------|
| code | String | ✓ | ✓ | Mã công việc |
| name | String | ✓ | - | Tên công việc |
| uom | ObjectId (Unit) | ✓ | - | Đơn vị tính |
| deviceCode | ObjectId (DeviceCode) | - | - | Mã thiết bị |
| price | Number | - | - | Giá (tự động tính) |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/assignmentcodes` | Tạo mã công việc |
| PUT | `/api/assignmentcodes/:id` | Cập nhật |
| DELETE | `/api/assignmentcodes/:id` | Xóa |
| GET | `/api/assignmentcodes` | Danh sách (phân trang) |
| POST | `/api/assignmentcodes/import` | Import từ Excel |
| GET | `/api/assignmentcodes/export` | Export ra Excel |

## Business Logic

### Tính giá tự động (Weighted Average Price)
Giá của AssignmentCode được tính từ giá trung bình có trọng số của tất cả MaterialAssignment liên kết:

```
price = Σ(material.price × material.quantity) / Σ(material.quantity)
```

- Giá được resolve theo tháng từ `priceHistory`
- Cron job chạy hàng ngày lúc 00:00 để cập nhật giá
- Khi GET danh sách, giá cũng được refresh tự động

## Relationships
- References: Unit, DeviceCode
- Referenced by: MaterialAssignment, AssignmentNorm, AdjustmentNorm, InitialPlannedCost, MaterialBudget, MaterialCostUsed
