## Giới thiệu dự án
Dự án **Kairos Garden** là một ứng dụng hỗ trợ tập trung, được xây dựng dựa trên kiến trúc Domain Driven Design (DDD) của ABP Framework.

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
*   Mật khẩu có 1 ký tự @
*   Mật khẩu có 1 ký tự @
*   Mật khẩu có 1 ký tự @
*   Quan trọng nhắc lại 3 lần, gửi tới tôi ở tương lai, đừng có reset database vì mật khẩu mặc định

## Hướng dẫn chạy dự án
1. Khởi động server: "net start postgresql-x64-16" (Server side)
2. Khởi động backend trong VS (Server side)
3. 6 (Vị trí danh dự)
4. CD vào vị trí mobile/android, kết nối tới thiết bị test, kiểm tra trạng thái thiết bị "adb devices" (Client side)
5. Khởi động ứng dụng "npm run android" (Client side)
6. Nếu gặp lỗi, spam vào terminal:
- "npm start -- --reset-cache"
- "cd android
./gradlew clean
cd .."
Trường hợp ở android sẵn rồi thì ko cần cd, chỉ cần clean là được
