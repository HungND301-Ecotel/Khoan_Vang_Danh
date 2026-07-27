# Auth Module

## Mô tả nghiệp vụ
Quản lý xác thực người dùng: đăng ký, đăng nhập, đổi mật khẩu.

## Model Schema - User

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| username | String | ✓ | Tên đăng nhập |
| password | String | ✓ | Mật khẩu (bcrypt hash) |
| fullName | String | ✓ | Họ tên |
| gender | String | - | Giới tính |
| email | String | - | Email |
| phone | String | - | Số điện thoại |
| avatar | String | - | Ảnh đại diện |
| role | String | - | Vai trò (default: "admin") |
| passwordChangedAt | Date | - | Thời điểm đổi mật khẩu |

## API Endpoints

### POST `/api/auths/register`
Đăng ký tài khoản mới
- **Input**: `{ username, password, fullName, gender, email, phone }`
- **Output**: JWT token (1 ngày)
- **Validation**: Username phải unique

### POST `/api/auths/login`
Đăng nhập
- **Input**: `{ username, password }`
- **Output**: JWT token (7 ngày)
- **Validation**: Kiểm tra password bằng bcrypt

### PUT `/api/auths/:id/changepass`
Đổi mật khẩu
- **Input**: `{ oldPassword, newPassword }`
- **Validation**: Kiểm tra oldPassword trước khi đổi

## Business Logic
- Password được hash bằng bcrypt trước khi lưu
- JWT token chứa `id` và `role` của user
- Pre-save hook tự động cập nhật `passwordChangedAt` khi password thay đổi
- Middleware `verifyToken` kiểm tra user còn tồn tại và password chưa bị thay đổi sau khi token được tạo

## Vấn đề hiện tại
- ⚠️ **Không có route nào sử dụng auth middleware** - tất cả API đều public
- ⚠️ Không có refresh token mechanism
- ⚠️ Không có rate limiting cho login
