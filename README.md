# Kairos Garden

## Giới thiệu

**Kairos Garden** là đồ án tốt nghiệp xây dựng một ứng dụng hỗ trợ người dùng tập trung và duy trì thói quen. Hệ thống gồm ứng dụng di động dành cho người dùng và trang web dành cho quản trị viên.

## Công nghệ sử dụng

- **Backend và trang quản trị:** ASP.NET Core trên .NET 9, ABP Framework.
- **Cơ sở dữ liệu:** PostgreSQL 16 và Entity Framework Core (tích hợp sẵn trong ABP Framework).
- **Ứng dụng di động:** React Native 0.83 và TypeScript.

## Điều kiện cần để cài đặt

### Backend và trang quản trị

- Windows 10+.
- Git.
- .NET SDK 9.
- Visual Studio 2022 đã cài workload **ASP.NET and web development**. Có thể dùng công cụ khác hỗ trợ .NET 9 nếu không sử dụng Visual Studio.
- PostgreSQL 16. Dữ liệu demo trong thư mục `data_db` được tạo bằng phiên bản này.
- Kết nối Internet trong lần đầu để tải các thư viện cần thiết.

### Ứng dụng Android

Ngoài các công cụ dành cho backend, cần cài thêm:

- Node.js 20 trở lên; npm được cài kèm Node.js.
- Android Studio.
- Android SDK 36 và Android Build Tools 36.
- JDK 17 trở lên.
- Máy ảo Android hoặc điện thoại Android đã bật chế độ gỡ lỗi USB.

Nếu chỉ chạy backend và trang quản trị thì không cần cài Node.js, Android Studio hoặc Android SDK.

### Prompt cài đặt môi trường dành cho AI Agent
```Cài môi trường để chạy dự án E:\Knowledtree trên Windows. Hãy thực hiện, không chỉ hướng dẫn.

1. Đọc AGENTS.md và README.md.
2. Kiểm tra và cài công cụ còn thiếu: Git, .NET SDK 9, PostgreSQL 16, Node.js, Yarn 1.22.22, JDK 17, Android Studio.
3. Đọc cấu hình trong mobile/android để cài đúng Android SDK, Build Tools và NDK. Thiết lập JAVA_HOME, ANDROID_HOME và PATH.
4. Cài các thư viện của backend và mobile theo cấu hình, lockfile có sẵn.
5. Dùng script của dự án để chuẩn bị database. Không xóa dữ liệu hoặc ghi đè mật khẩu có sẵn.
6. Chạy Knowledtree.Web theo AGENTS.md. Mở https://localhost:44353 hoặc http://localhost:5000 để kiểm tra.
7. Khởi động máy ảo Android, chạy Metro và app mobile. Kiểm tra app kết nối được backend.

Làm lần lượt từng bước, kiểm tra thành công rồi mới tiếp tục. Không tự nâng phiên bản thư viện. Chỉ hỏi khi thiếu quyền hoặc mật khẩu. Báo phần đã chạy được và lỗi còn lại.
```
