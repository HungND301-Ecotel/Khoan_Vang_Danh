# Backend Documentation - Khoan Vang Danh

## Tổng quan dự án

Hệ thống quản lý chi phí khoan vàng đánh cho công ty khai thác than (VINACOMIN). Backend được xây dựng bằng Node.js + Express + MongoDB.

## Technology Stack

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | LTS | Runtime |
| Express | v5 | Web framework |
| MongoDB | - | Database |
| Mongoose | v8 | ODM |
| JWT | - | Authentication |
| bcryptjs | - | Password hashing |
| exceljs + xlsx | - | Excel import/export |
| node-cron | - | Scheduled tasks |
| multer | - | File upload |

## Cấu trúc thư mục

```
backend/
├── config/           # Cấu hình ứng dụng
│   ├── constant.js   # Hằng số (PhaseType, AdjustmentType)
│   └── db.js         # Kết nối MongoDB
├── controller/       # Business logic (28 files)
├── data-seeder/      # Khởi tạo dữ liệu mẫu
├── middleware/        # Auth middleware
├── model/            # Mongoose schemas (24 files)
├── routes/           # API routes (28 files)
├── utils/            # Utilities
│   ├── codeValidator.js
│   ├── config_export.js
│   ├── cron.js
│   ├── helpers.js
│   ├── pagination.js
│   └── recalculateAssignmentCodePrice.js
└── index.js          # Entry point
```

## Business Flow

```
Master Data → Material Assignment → Norm Definition → Initial Planning → Actual Cost → Settlement
     ↓              ↓                    ↓                  ↓               ↓            ↓
  Departments    Materials          AssignmentNorm      InitialPlanned   MaterialCost  Contract
  Phases         with prices        AdjustmentNorm      Cost             Used          Settlement
  Parameters     (priceHistory)
```

## Module Categories

### 1. Authentication & User
- [Auth](modules/auth.md) - Đăng ký, đăng nhập, đổi mật khẩu
- [User](modules/user.md) - Quản lý người dùng

### 2. Tổ chức & Tham số kỹ thuật
- [Department](modules/department.md) - Phòng ban/Phân xưởng
- [PhaseGroup](modules/phasegroup.md) - Nhóm công đoạn
- [Phase](modules/phase.md) - Công đoạn
- [ProductionScope](modules/productionscope.md) - Phạm vi sản xuất
- [Unit](modules/unit.md) - Đơn vị tính
- [DeviceCode](modules/devicecode.md) - Mã thiết bị
- [ExcavationTech](modules/excavationtech.md) - Công nghệ đào lò
- [Hardness](modules/hardness.md) - Độ cứng đá
- [CrossSection](modules/crosssection.md) - Tiết diện lò
- [CurbSlope](modules/curbslope.md) - Độ dốc vỉa than
- [Thickness](modules/thickness.md) - Độ dày vỉa than
- [Length](modules/length.md) - Chiều dài
- [MiningTech](modules/miningtech.md) - Công nghệ khai thác
- [Step](modules/step.md) - Bước chống giữ
- [RockRatio](modules/rockratio.md) - Tỷ lệ đá
- [MirrorRatio](modules/mirrorratio.md) - Tỷ lệ than mềm

### 3. Core Business
- [AssignmentCode](modules/assignmentcode.md) - Mã công việc (trọng tâm)
- [MaterialAssignment](modules/materialassignment.md) - Định mức vật tư
- [AssignmentNorm](modules/assignmentnorm.md) - Định mức sản xuất
- [AdjustmentNorm](modules/adjustmentnorm.md) - Hệ số điều chỉnh

### 4. Cost Management
- [InitialPlannedCost](modules/initialplannedcost.md) - Chi phí kế hoạch ban đầu
- [MaterialBudget](modules/materialbudget.md) - Ngân sách vật tư
- [MaterialCostUsed](modules/materialcostused.md) - Chi phí thực tế
- [OtherMaterialCost](modules/othermaterialcost.md) - Chi phí ngoài hợp đồng

### 5. Reporting
- [ContractSettlement](modules/contractsettlement.md) - Quyết toán hợp đồng

### 6. System
- [SystemConfig](modules/systemconfig.md) - Cấu hình hệ thống

## API Routes Summary

| Route | Controller | Mô tả |
|-------|-----------|--------|
| `/api/auths` | Auth | Xác thực |
| `/api/users` | User | Người dùng |
| `/api/assignmentcodes` | AssignmentCode | Mã công việc |
| `/api/assignmentnorms` | AssignmentNorm | Định mức sản xuất |
| `/api/adjustmentnorms` | AdjustmentNorm | Hệ số điều chỉnh |
| `/api/materialassignments` | MaterialAssignment | Định mức vật tư |
| `/api/materialbudgets` | MaterialBudget | Ngân sách vật tư |
| `/api/materialcostuseds` | MaterialCostUsed | Chi phí thực tế |
| `/api/initialplannedcosts` | InitialPlannedCost | Kế hoạch ban đầu |
| `/api/contractsettlements` | ContractSettlement | Quyết toán |
| `/api/othermaterialcosts` | OtherMaterialCost | Chi phí ngoài |
| `/api/units` | Unit | Đơn vị tính |
| `/api/phasegroups` | PhaseGroup | Nhóm công đoạn |
| `/api/phases` | Phase | Công đoạn |
| `/api/excavationtechs` | ExcavationTech | Công nghệ đào |
| `/api/hardness` | Hardness | Độ cứng |
| `/api/crosssections` | CrossSection | Tiết diện |
| `/api/curbslopes` | CurbSlope | Độ dốc |
| `/api/thickness` | Thickness | Độ dày |
| `/api/length` | Length | Chiều dài |
| `/api/miningtechs` | MiningTech | Công nghệ khai thác |
| `/api/steps` | Step | Bước chống |
| `/api/rockratios` | RockRatio | Tỷ lệ đá |
| `/api/mirrorratios` | MirrorRatio | Tỷ lệ than mềm |
| `/api/productionscopes` | ProductionScope | Phạm vi sản xuất |
| `/api/devicecodes` | DeviceCode | Mã thiết bị |
| `/api/departments` | Department | Phòng ban |
| `/api/system-configs` | SystemConfig | Cấu hình hệ thống |
