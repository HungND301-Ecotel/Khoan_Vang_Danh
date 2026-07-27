# User Module

## Mô tả nghiệp vụ
Quản lý thông tin người dùng.

## API Endpoints

### PUT `/api/users/update/:id`
Cập nhật thông tin user
- **Input**: `{ fullName, gender, email, phone, avatar }`
- **Output**: User object (không bao gồm password)
- **Note**: Không cho phép update username, password, role

## Business Logic
- Strip password khỏi response khi trả về
- Chỉ cho phép update một số field nhất định

## Vấn đề hiện tại
- ⚠️ Không có endpoint GET để lấy thông tin user
- ⚠️ Không có endpoint DELETE để xóa user
- ⚠️ Không có endpoint LIST để liệt kê users
- ⚠️ Không có phân quyền - ai cũng có thể update user khác
