---
description: Hướng dẫn khởi động server backend (Knowledtree.Web) đúng quy trình, tuyệt đối không tự ý dev-certs
---

# Quy trình khởi động phần Backend Web Server

Để tránh lỗi ngớ ngẩn làm sập Kestrel do HTTPS Certificate hoặc treo tiến trình, TUYỆT ĐỐI không được gọi lệnh yêu cầu Trust Certificate (`dotnet dev-certs`) gây popup phiền hà cho user. 

Hãy làm theo các bước sau:

1. **Khởi động Database trước (Nếu chưa chạy)**
   Chạy file batch để đảm bảo PostgreSQL Portable đang chạy:
   ```bash
   cd e:\Knowledtree\src
   start_db.bat
   ```
   *(Lưu ý: Nếu bật server mà Postgres chưa chạy, tiến trình MSBuild trong `dotnet run` có thể bị treo pipe)*

2. **Khởi động Backend Web (ABP Framework)**
   Đi tới thư mục `Knowledtree.Web` và khởi chạy server mà không yêu cầu HTTPS:
   ```bash
   cd e:\Knowledtree\src\Knowledtree.Web
   dotnet run --urls "http://localhost:5000"
   ```
   *(Hoặc chạy theo profile được thiết lập để tránh lỗi HTTPs Dev Cert)*

!! CHÚ Ý QUAN TRỌNG DÀNH CHO AI !!
- KHÔNG sử dụng `dotnet dev-certs https --trust` trừ khi User chủ động yêu cầu.
- Nếu lệnh chạy bị treo ngầm quá 2 phút, rất có thể là treo ở bước cài npm/gulp, hoặc do pipe MSBuild, hãy hiển thị ra ngoài terminal hoặc kiểm tra lại các background worker.
- Các logs có thể xem chi tiết ở `e:\Knowledtree\src\Knowledtree.Web\Logs\logs.txt` thay vì in thẳng ra console nếu bị lỗi hiển thị.
