# Đánh giá cấu trúc Backend & Đề xuất Refactor

## 1. Đánh giá hiện tại

### ✅ Điểm mạnh
- Cấu trúc MVC rõ ràng (Model-View-Controller)
- Tách biệt routes/controllers/models
- Sử dụng middleware cho auth
- Có utility functions tái sử dụng được
- Import/Export Excel cho hầu hết modules

### ❌ Vấn đề cần khắc phục

#### 1.1 Code Duplication (Lặp code nghiêm trọng)
```
// 10+ modules có CRUD code gần như identical:
- create, update, delete, get (pagination)
- import, export Excel
```

**Mức độ:** 🔴 Nghiêm trọng - Ước tính 60-70% code lặp lại

#### 1.2 Thiếu Auth Middleware
- Auth middleware đã tạo nhưng KHÔNG áp dụng cho bất kỳ route nào
- Tất cả API đều public - nguy cơ bảo mật cao

**Mức độ:** 🔴 Nghiêm trọng

#### 1.3 Controller Quá Lớn
- `ContractSettlement.js`: ~500+ lines
- `InitialPlannedCost.js`: ~400+ lines
- `MaterialCostUsed.js`: ~400+ lines

**Mức độ:** 🟡 Trung bình

#### 1.4 Không có Error Handling统一
- Mỗi controller tự xử lý error khác nhau
- Thiếu centralized error handler
- Không có validation middleware

**Mức độ:** 🟡 Trung bình

#### 1.5 Thiếu Service Layer
- Business logic nằm trực tiếp trong controller
- Khó test, khó maintain

**Mức độ:** 🟡 Trung bình

#### 1.6 Naming Inconsistency
- File names: `othermaterialcosts.js` vs `OtherMaterialCost.js`
- Route paths: `/api/othermaterialcosts` vs `/api/contractsettlements`

**Mức độ:** 🟢 Nhẹ

---

## 2. Đề xuất cấu trúc mới

### 2.1 Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/
│   │   ├── constant.js
│   │   ├── db.js
│   │   └── env.js                    # Environment validation
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.validation.js
│   │   │   └── auth.middleware.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   ├── user.model.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── assignment-code/
│   │   │   ├── assignment-code.controller.js
│   │   │   ├── assignment-code.service.js
│   │   │   ├── assignment-code.routes.js
│   │   │   ├── assignment-code.model.js
│   │   │   └── assignment-code.validation.js
│   │   │
│   │   ├── material/
│   │   │   ├── assignment/            # MaterialAssignment
│   │   │   │   ├── material-assignment.controller.js
│   │   │   │   ├── material-assignment.service.js
│   │   │   │   ├── material-assignment.routes.js
│   │   │   │   ├── material-assignment.model.js
│   │   │   │   └── material-assignment.validation.js
│   │   │   │
│   │   │   ├── budget/                # MaterialBudget
│   │   │   ├── cost-used/             # MaterialCostUsed
│   │   │   └── other-cost/            # OtherMaterialCost
│   │   │
│   │   ├── norm/
│   │   │   ├── assignment-norm/       # AssignmentNorm
│   │   │   └── adjustment-norm/       # AdjustmentNorm
│   │   │
│   │   ├── cost/
│   │   │   ├── initial-planned/       # InitialPlannedCost
│   │   │   └── settlement/            # ContractSettlement
│   │   │
│   │   ├── reference/                 # Simple CRUD modules
│   │   │   ├── department/
│   │   │   ├── phase-group/
│   │   │   ├── phase/
│   │   │   ├── production-scope/
│   │   │   ├── unit/
│   │   │   ├── device-code/
│   │   │   ├── excavation-tech/
│   │   │   ├── hardness/
│   │   │   ├── cross-section/
│   │   │   ├── curb-slope/
│   │   │   ├── thickness/
│   │   │   ├── length/
│   │   │   ├── mining-tech/
│   │   │   ├── step/
│   │   │   ├── rock-ratio/
│   │   │   └── mirror-ratio/
│   │   │
│   │   └── system-config/
│   │
│   ├── shared/
│   │   ├── base/
│   │   │   ├── base.controller.js     # Generic CRUD controller
│   │   │   ├── base.service.js        # Generic CRUD service
│   │   │   └── base.model.js          # Base model với common fields
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── upload.middleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── pagination.js
│   │   │   ├── helpers.js
│   │   │   ├── codeValidator.js
│   │   │   ├── excelHelper.js
│   │   │   └── priceCalculator.js     # Merge recalculateAssignmentCodePrice
│   │   │
│   │   └── exceptions/
│   │       ├── AppError.js
│   │       └── NotFoundError.js
│   │
│   ├── app.js                         # Express app setup
│   └── server.js                      # Entry point
│
├── data-seeder/
├── .env
├── .gitignore
├── package.json
└── Dockerfile
```

### 2.2 Base Controller Pattern

```javascript
// shared/base/base.controller.js
class BaseController {
  constructor(service) {
    this.service = service;
  }

  create = async (req, res, next) => {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.service.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  get = async (req, res, next) => {
    try {
      const result = await this.service.getPaginated(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = BaseController;
```

### 2.3 Base Service Pattern

```javascript
// shared/base/base.service.js
class BaseService {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const doc = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  }

  async delete(id) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  }

  async getPaginated(query) {
    const { page = 1, limit = 10, ...filter } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]);

    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = BaseService;
```

### 2.4 Reference Module Template

```javascript
// modules/reference/department/department.controller.js
const BaseController = require('../../../shared/base/base.controller');
const DepartmentService = require('./department.service');

class DepartmentController extends BaseController {
  constructor() {
    super(new DepartmentService());
  }

  // Thêm import/export nếu cần
  import = async (req, res, next) => {
    // Custom import logic
  };

  export = async (req, res, next) => {
    // Custom export logic
  };
}

module.exports = new DepartmentController();
```

### 2.5 Error Handling

```javascript
// shared/middleware/error.middleware.js
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming error - don't leak details
  console.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
};

module.exports = errorMiddleware;
```

---

## 3. Kế hoạch Refactor

### Phase 1: Foundation (Ưu tiên cao)
1. ✅ Tạo cấu trúc thư mục mới
2. ✅ Tạo Base Controller/Service
3. ✅ Tạo Error Handling middleware
4. ✅ Tạo Validation middleware
5. ✅ Áp dụng Auth middleware cho tất cả routes

### Phase 2: Simple Modules (Ưu tiên cao)
1. Refactor 16 reference modules sang pattern mới
2. Giảm code duplication ước tính 70%
3. Thời gian: 2-3 ngày

### Phase 3: Core Modules (Ưu tiên trung bình)
1. Refactor AssignmentCode, MaterialAssignment
2. Refactor AssignmentNorm, AdjustmentNorm
3. Thời gian: 3-4 ngày

### Phase 4: Complex Modules (Ưu tiên trung bình)
1. Refactor InitialPlannedCost
2. Refactor MaterialCostUsed
3. Refactor MaterialBudget
4. Tách business logic vào Service layer
5. Thời gian: 5-7 ngày

### Phase 5: Settlement Module (Ưu tiên thấp)
1. Refactor ContractSettlement (module lớn nhất)
2. Tách thành nhiều sub-services
3. Thời gian: 3-4 ngày

---

## 4. Ước tính hiệu quả

| Metric | Hiện tại | Sau refactor | Cải thiện |
|--------|----------|--------------|------------|
| Số files | ~80 | ~100 | +25% (tổ chức tốt hơn) |
| Code duplication | ~60% | ~10% | -50% |
| Avg controller size | ~200 lines | ~50 lines | -75% |
| Testability | Khó | Dễ | ⬆️⬆️⬆️ |
| Maintainability | Trung bình | Cao | ⬆️⬆️ |

---

## 5. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes | Cao | Viết tests trước khi refactor |
| Time consuming | Trung bình | Refactor từng module, không phải tất cả cùng lúc |
| Learning curve | Thấp | Document patterns rõ ràng |

---

## 6. Kết luận

Cấu trúc hiện tại **hoạt động được** nhưng **không maintainable** lâu dài. Việc refactor sẽ:
- Giảm code duplication từ 60% xuống 10%
- Dễ dàng thêm module mới
- Dễ dàng viết unit tests
- Dễ dàng onboard developer mới
- Tăng tính bảo mật (auth middleware)

**Đề xuất:** Bắt đầu từ Phase 1 + Phase 2 (simple modules) để thấy hiệu quả nhanh nhất.
