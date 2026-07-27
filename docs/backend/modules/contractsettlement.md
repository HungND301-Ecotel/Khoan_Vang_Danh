# ContractSettlement Module

## Mô tả nghiệp vụ
Module quyết toán hợp đồng - module lớn nhất về reporting. So sánh chi phí kế hoạch vs thực tế, tạo báo cáo Excel chi tiết.

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/contractsettlements/month` | Báo cáo theo tháng |
| GET | `/api/contractsettlements/quarter` | Báo cáo theo quý |
| GET | `/api/contractsettlements/excel` | Export Excel theo tháng |
| GET | `/api/contractsettlements/quarter-excel` | Export Excel theo quý |
| GET | `/api/contractsettlements/dashboard` | Dashboard data |
| PUT | `/api/contractsettlements/update-material-assignment` | Cập nhật mã VT |
| PUT | `/api/contractsettlements/update-material-quantity` | Cập nhật số lượng |

## Business Logic

### getMonth
Lấy dữ liệu quyết toán theo khoảng thời gian, nhóm theo tháng.
- **Mode "byScope"**: Lọc theo phạm vi sản xuất cụ thể
- **Mode "allScopes"**: Tất cả phạm vi cho một phòng ban
- Kết hợp dữ liệu budget (kế hoạch) với used (thực tế)
- Tính variance = plan - used

### getQuarter
Tổng hợp 3 tháng dữ liệu cho báo cáo quý.

### getExcel
Tạo báo cáo Excel phức tạp với multi-header:
- Hàng than nguyên khai (tấn)
- Mét đào lò
- Mét xẻ lò
- Tỷ lệ đá
- Các hàng AssignmentCode với cột plan/used/variance
- Section "Công việc khác"
- Section tổng hợp

### getDashboardData
Trả về dữ liệu tổng hợp theo tháng cho dashboard charts:
- totalUsed, totalPlanned
- grossLoss, grossSavings
- netVariance

### updateMaterialAssignmentCode
Cho phép gán lại vật tư sang mã công việc khác trong MaterialCostUsed, tính lại giá và thành tiền.

### updateMaterialQuantity
Cho phép cập nhật số lượng vật tư trong MaterialCostUsed, tính lại thành tiền và totalUsedCost.

### transformToTableData()
Transform dữ liệu API thành cấu trúc bảng phẳng với các hàng vật tư được căn chỉnh across tất cả blocks (month+phase combinations).

## Relationships
- Đọc từ: InitialPlannedCost, MaterialBudget, MaterialCostUsed, OtherMaterialCost
- Cập nhật: MaterialCostUsed (assignment code, quantity)
