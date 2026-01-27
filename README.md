## Giới thiệu dự án
Dự án **Knowledtree** là một ứng dụng hỗ trợ tập trung, được xây dựng dựa trên kiến trúc Domain Driven Design (DDD) của ABP Framework.

### Bối cảnh & Mục tiêu
Respository này được thiết kế để phục vụ các mục đích chính trong cùng một codebase (monorepo):
1.  **Web Admin Portal**: Trang quản trị dành cho người quản lý hệ thống (được xây dựng sẵn trên nền tảng MVC/Razor Pages của ABP).
2.  **Mobile App Backend**: Cung cấp hệ thống API và bảo mật để phục vụ cho ứng dụng Mobile.
3.  **Mobile App**: Ứng dụng Mobile được phát triển bằng **React Native** và **TypeScript**, được đặt trong cùng repository.

## Cấu hình đã được tùy chỉnh
Để thuận tiện cho quá trình phát triển, dự án đã được tích hợp sẵn các công cụ tự động:
*   **Tự động bật Database**: File `start_db.bat` sẽ tự động chạy khi **F5** (Run) trong Visual Studio, giúp bật PostgreSQL Portable.
*   **Tự động Reset Mật khẩu Admin**: Mỗi khi chạy Migration, mật khẩu của tài khoản `admin` sẽ được đặt lại về mặc định.

### Thông tin đăng nhập mặc định (Phòng trường hợp người viết README quên)
*   **Username**: `admin`
*   **Password**: `V****************39@` (Đã được cấu hình tự động reset)

## Hướng dẫn chạy dự án (Server side only)
1.  Mở `Knowledtree.sln` bằng Visual Studio.
2.  Đặt **`Knowledtree.Web`** làm **Startup Project**.
3.  6
