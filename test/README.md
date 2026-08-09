# Hướng dẫn chạy automated regression test

Bộ test sử dụng xUnit, ABP TestBase và SQLite in-memory để kiểm tra các luồng
nghiệp vụ. Test không đọc hoặc thay đổi dữ liệu trong PostgreSQL của ứng dụng.

## Yêu cầu

- .NET 9 SDK.
- Chạy lệnh từ thư mục gốc của repository, nơi có `Knowledtree.sln`.

Kiểm tra phiên bản .NET:

```powershell
dotnet --version
```

Khôi phục package trong lần chạy đầu tiên:

```powershell
dotnet restore Knowledtree.sln
```

## Chạy toàn bộ test

```powershell
dotnet test Knowledtree.sln `
  --nologo `
  --verbosity minimal `
  -p:SkipStartDatabase=true
```

`SkipStartDatabase=true` chỉ bỏ qua script khởi động PostgreSQL trong lúc build
test. Khi chạy `Knowledtree.Web` bình thường, quy trình khởi động database không
thay đổi.

Kết quả tại thời điểm bổ sung regression test:

- `Knowledtree.EntityFrameworkCore.Tests`: 35 test.
- `Knowledtree.Web.Tests`: 8 test.
- Tổng cộng: 43 test pass.

Các project `Knowledtree.TestBase`, `Knowledtree.Domain.Tests` và
`Knowledtree.Application.Tests` có thể hiện thông báo `No test is available`.
Đây không phải lỗi: chúng đang chứa hạ tầng hoặc lớp test abstract dùng bởi
`Knowledtree.EntityFrameworkCore.Tests`.

## Chạy riêng regression test API mới

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --nologo `
  --filter "FullyQualifiedName~FriendshipAppServiceTests|FullyQualifiedName~TagAppServiceTests|FullyQualifiedName~UserAvatarAppServiceTests|FullyQualifiedName~AdminUserBalanceAppServiceTests"
```

## Chạy test của một màn hình

Friendship:

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --filter "FullyQualifiedName~FriendshipAppServiceTests"
```

Tag:

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --filter "FullyQualifiedName~TagAppServiceTests"
```

Avatar:

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --filter "FullyQualifiedName~UserAvatarAppServiceTests"
```

Admin Balance:

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --filter "FullyQualifiedName~AdminUserBalanceAppServiceTests"
```

## Chạy một test case cụ thể

Ví dụ chỉ chạy luồng gửi và chấp nhận lời mời kết bạn:

```powershell
dotnet test `
  test\Knowledtree.EntityFrameworkCore.Tests\Knowledtree.EntityFrameworkCore.Tests.csproj `
  --filter "FullyQualifiedName~Friendship_Request_Should_Appear_For_Both_Users_And_Be_Accepted"
```

## Khi nào nên chạy

- Trước khi bắt đầu sửa hoặc thêm tính năng, để xác nhận baseline đang xanh.
- Sau khi hoàn thành thay đổi.
- Trước khi commit hoặc tạo pull request.

Nếu test cũ bị fail sau một thay đổi, cần xác định hành vi cũ thực sự bị phá vỡ
hay yêu cầu nghiệp vụ đã được thay đổi có chủ đích. Chỉ cập nhật test khi yêu cầu
nghiệp vụ đã thay đổi.
