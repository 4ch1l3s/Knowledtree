---
description: Hướng dẫn cài đặt GitHub App để tự động review code mỗi khi push
---

# Cài đặt GitHub App tự động Review Code

Workflow này hướng dẫn cài đặt **CodeRabbit** - một AI-powered code review tool.

## Yêu cầu trước khi bắt đầu

- Repository đã được push lên GitHub
- Bạn có quyền admin trên repository đó

## Các bước thực hiện

### Bước 1: Kiểm tra repository đã được push lên GitHub chưa

```powershell
git remote -v
```

Nếu chưa có remote, hãy thêm:
```powershell
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

### Bước 2: Truy cập trang cài đặt CodeRabbit

Mở link sau trong trình duyệt:
**https://github.com/apps/coderabbitai**

### Bước 3: Cài đặt CodeRabbit vào repository

1. Nhấn nút **"Install"** màu xanh
2. Chọn account/organization của bạn
3. Chọn **"Only select repositories"** và chọn repository cần cài
4. Nhấn **"Install & Authorize"**

### Bước 4: Cấu hình CodeRabbit (tùy chọn)

Tạo file `.coderabbit.yaml` trong thư mục gốc của project để tùy chỉnh:

```yaml
# .coderabbit.yaml
language: "vi-VN"  # Sử dụng tiếng Việt cho review
reviews:
  auto_review:
    enabled: true
    drafts: false  # Không review draft PRs
  path_filters:
    - "!**/node_modules/**"
    - "!**/bin/**"
    - "!**/obj/**"
    - "!**/*.min.js"
    - "!**/*.min.css"
  path_instructions:
    - path: "src/**/*.cs"
      instructions: "Review C# code following ABP Framework best practices"
    - path: "mobile/**/*.tsx"
      instructions: "Review React Native TypeScript code"
chat:
  auto_reply: true
```

### Bước 5: Tạo Pull Request để test

```powershell
# Tạo branch mới
git checkout -b feature/test-code-review

# Thêm một thay đổi nhỏ
# (thay đổi một file bất kỳ)

# Commit và push
git add .
git commit -m "test: Test CodeRabbit auto review"
git push -u origin feature/test-code-review
```

Sau đó tạo Pull Request trên GitHub và CodeRabbit sẽ tự động review!

## Các GitHub Apps khác để tự động review

| App | Link cài đặt | Mô tả |
|-----|--------------|-------|
| **Sourcery** | https://github.com/apps/sourcery-ai | AI review, tốt cho Python |
| **SonarCloud** | https://github.com/apps/sonarcloud | Code quality & security |
| **Codacy** | https://github.com/apps/codacy-production | Automated code review |
| **DeepSource** | https://github.com/apps/deepsource-autofix | Tự động fix bugs |

## Lưu ý

- CodeRabbit sẽ **chỉ review trên Pull Requests**, không review trực tiếp trên commits
- Bạn cần tạo PR để trigger auto review
- Free plan có giới hạn số lần review/tháng cho private repos
