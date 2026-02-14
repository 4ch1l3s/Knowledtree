# 📖 Knowledtree Mobile — Theme System Documentation

> **Version:** 1.0
> **Cập nhật:** 2026-02-14
> **Đường dẫn:** `mobile/src/theme/`

---

## 1. Tổng quan

Theme System của Knowledtree Mobile được thiết kế theo nguyên tắc **module hóa**, cho phép:

- Chuyển đổi giữa Light / Dark mode (hoặc tự động theo hệ thống)
- Thêm theme mới mà không cần sửa bất kỳ screen nào
- Tất cả màu sắc derive từ **5 palette colors** cố định

---

## 2. Cấu trúc thư mục

```
mobile/src/theme/
├── colors.ts          # Bảng màu gốc (palette, derived, status)
├── theme.ts           # Theme interface + light/dark implementations
├── ThemeContext.tsx    # React Context, Provider, useTheme() hook
├── index.ts           # Re-export tất cả (entry point duy nhất)
└── THEME_GUIDE.md     # Tài liệu này
```

### Quy tắc import

Screens và components **chỉ import từ `index.ts`**, không bao giờ import trực tiếp từ file con:

```typescript
// ✅ Đúng
import { useTheme } from '../theme';
import { palette, lightTheme } from '../theme';

// ❌ Sai
import { palette } from '../theme/colors';
import { lightTheme } from '../theme/theme';
```

---

## 3. Bảng màu (colors.ts)

### 3.1 Palette — 5 màu core

| Tên | Hex | Mô tả | Vai trò chính |
|-----|-----|--------|---------------|
| `mintCream` | `#F1FFFA` | Trắng xanh nhạt | Light surface, dark text |
| `teaGreen` | `#CCFCCB` | Xanh lá nhạt | Light background |
| `celadon` | `#96E6B3` | Xanh lá trung bình | Accents, borders, dark primary |
| `fernGreen` | `#568259` | Xanh lá đậm | Light primary, dark border |
| `charcoal` | `#464947` | Xám đậm | Light text |

### 3.2 Derived — Màu mở rộng cho Dark mode

| Tên | Hex | Nguồn gốc |
|-----|-----|-----------|
| `darkBg` | `#464E47` | Charcoal + green tint → Dark background |
| `darkSurface` | `#526556` | Giữa charcoal và fernGreen → Dark cards |
| `darkSurfaceAlt` | `#4A5A4D` | Variant nhẹ hơn darkBg → Dark inputs |
| `deepForest` | `#3D5A40` | FernGreen tối hơn → Light primaryDark |

### 3.3 Status — Màu trạng thái (cố định)

| Tên | Hex | Dùng cho |
|-----|-----|----------|
| `error` / `errorLight` / `errorDark` | `#EF4444` / `#FCA5A5` / `#6B2020` | Lỗi, validation |
| `warning` / `warningLight` | `#F59E0B` / `#FCD34D` | Cảnh báo |
| `info` / `infoLight` | `#3B82F6` / `#93C5FD` | Thông tin |

> **Lưu ý:** Màu status giữ chuẩn UX (đỏ/vàng/xanh dương), không thay đổi theo palette.

---

## 4. Theme Interface (theme.ts)

### 4.1 Danh sách Color Tokens

Đây là danh sách đầy đủ các **semantic color tokens** mà screens sử dụng. Khi tạo theme mới, bạn **phải** cung cấp giá trị cho tất cả tokens này.

#### Backgrounds & Surfaces

| Token | Mô tả | Light | Dark |
|-------|--------|-------|------|
| `background` | Màu nền chính của screen | `#CCFCCB` | `#464E47` |
| `backgroundSecondary` | Nền input fields trên surface | `#F1FFFA` | `#4A5A4D` |
| `backgroundTertiary` | Nền level 3 | `#F1FFFA` | `#526556` |
| `surface` | Nền card, modal, bottom sheet | `#F1FFFA` | `#526556` |
| `surfaceSecondary` | Surface variant | `#CCFCCB` | `#4A5A4D` |

#### Primary & Secondary

| Token | Mô tả | Light | Dark |
|-------|--------|-------|------|
| `primary` | Màu hành động chính (buttons, links) | `#568259` | `#96E6B3` |
| `primaryLight` | Variant sáng hơn | `#96E6B3` | `#CCFCCB` |
| `primaryDark` | Variant tối hơn | `#3D5A40` | `#568259` |
| `onPrimary` | Text/icon **trên** nền primary | `#F1FFFA` | `#464947` |
| `secondary` | Màu phụ | `#96E6B3` | `#568259` |
| `secondaryLight` | Variant sáng | `#CCFCCB` | `#96E6B3` |
| `onSecondary` | Text trên nền secondary | `#464947` | `#F1FFFA` |

#### Text

| Token | Mô tả | Light | Dark |
|-------|--------|-------|------|
| `text` | Text chính (headings, body) | `#464947` | `#F1FFFA` |
| `textSecondary` | Text phụ (subtitles, labels) | `#568259` | `#CCFCCB` |
| `textTertiary` | Text mờ (placeholders, hints) | `#96E6B3` | `#96E6B3` |
| `textInverse` | Text ngược (trên nền tối/sáng) | `#F1FFFA` | `#464947` |

#### Borders & UI

| Token | Mô tả | Light | Dark |
|-------|--------|-------|------|
| `border` | Viền chính | `#96E6B3` | `#568259` |
| `borderLight` | Viền nhẹ | `#CCFCCB` | `#526556` |
| `disabled` | Trạng thái disabled | `#96E6B3` | `#4A5A4D` |
| `link` | Hyperlinks | `#568259` | `#96E6B3` |

#### Status

| Token | Mô tả | Light | Dark |
|-------|--------|-------|------|
| `error` | Màu lỗi | `#EF4444` | `#FCA5A5` |
| `errorLight` | Nền thông báo lỗi | `#FCA5A5` | `#6B2020` |
| `success` | Màu thành công | `#568259` | `#96E6B3` |
| `successLight` | Nền thông báo thành công | `#96E6B3` | `#CCFCCB` |
| `warning` | Màu cảnh báo | `#F59E0B` | `#FCD34D` |
| `warningLight` | Nền cảnh báo | `#FCD34D` | `#F59E0B` |
| `info` | Màu thông tin | `#3B82F6` | `#93C5FD` |
| `infoLight` | Nền thông tin | `#93C5FD` | `#3B82F6` |

### 4.2 Layout Tokens

Các giá trị này **giống nhau** giữa tất cả themes:

#### Spacing

| Token | Giá trị | Dùng cho |
|-------|---------|---------|
| `xs` | 4 | Khoảng cách rất nhỏ |
| `sm` | 8 | Khoảng cách nhỏ |
| `md` | 16 | Khoảng cách mặc định |
| `lg` | 24 | Khoảng cách lớn |
| `xl` | 32 | Khoảng cách rất lớn |
| `xxl` | 48 | Khoảng cách đặc biệt |

#### Border Radius

| Token | Giá trị | Dùng cho |
|-------|---------|---------|
| `sm` | 4 | Tags, badges |
| `md` | 8 | Small cards, chips |
| `lg` | 12 | Buttons, inputs |
| `xl` | 16 | Cards, modals |
| `full` | 9999 | Circles, pills |

#### Typography

| Token | Giá trị |
|-------|---------|
| `fontSizeXs` | 12 |
| `fontSizeSm` | 14 |
| `fontSizeMd` | 16 |
| `fontSizeLg` | 18 |
| `fontSizeXl` | 24 |
| `fontSizeXxl` | 32 |
| `fontWeightRegular` | '400' |
| `fontWeightMedium` | '500' |
| `fontWeightBold` | '700' |

#### Shadows

| Token | Elevation | Dùng cho |
|-------|-----------|---------|
| `sm` | 2 | Subtle lift (buttons) |
| `md` | 4 | Cards |
| `lg` | 8 | Modals, floating elements |

---

## 5. ThemeContext (ThemeContext.tsx)

### 5.1 API

```typescript
interface ThemeContextType {
  theme: Theme;                          // Theme object hiện tại
  themeMode: 'light' | 'dark' | 'auto'; // Mode đang chọn
  isDark: boolean;                       // Theme hiện tại có phải dark không
  setThemeMode: (mode: ThemeMode) => void; // Đặt mode cụ thể
  toggleTheme: () => void;               // Toggle giữa light ↔ dark
}
```

### 5.2 Cơ chế hoạt động

```
User chọn mode → setThemeMode()
                      ↓
              Lưu vào AsyncStorage
                      ↓
              resolveTheme(mode)
              ├── 'light' → lightTheme
              ├── 'dark'  → darkTheme
              └── 'auto'  → theo system preference
                      ↓
              Tất cả screens re-render với theme mới
```

- Khi app khởi động, đọc mode từ AsyncStorage
- Mode `'auto'` tự theo `useColorScheme()` của React Native
- Preference được persist, không mất khi tắt app

---

## 6. Hướng dẫn sử dụng

### 6.1 Sử dụng trong Screen/Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

const MyScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, theme.shadows.md]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Tiêu đề
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Mô tả phụ
        </Text>
      </View>
    </View>
  );
};

// Styles KHÔNG chứa màu - chỉ chứa layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
});
```

### 6.2 Quy tắc quan trọng

| ✅ Làm | ❌ Không làm |
|--------|-------------|
| Dùng `theme.colors.text` | Hardcode `color: '#464947'` |
| Dùng `theme.colors.background` | Hardcode `backgroundColor: '#CCFCCB'` |
| Dùng `theme.shadows.md` | Tự viết shadow object |
| Để màu trong inline style `{ color: theme.colors.X }` | Để màu trong StyleSheet |
| Để layout (padding, fontSize) trong StyleSheet | Để layout trong inline style |

**Nguyên tắc phân chia:**
- **StyleSheet** = layout, kích thước, vị trí (không đổi theo theme)
- **Inline style** = màu sắc, shadow (thay đổi theo theme)

### 6.3 Toggle Theme trong UI

```typescript
import { useTheme } from '../theme';

const SettingsScreen = () => {
  const { isDark, toggleTheme, setThemeMode } = useTheme();

  // Toggle đơn giản
  <Button onPress={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'} />

  // Hoặc chọn cụ thể
  <Button onPress={() => setThemeMode('light')} title="Light" />
  <Button onPress={() => setThemeMode('dark')} title="Dark" />
  <Button onPress={() => setThemeMode('auto')} title="Auto" />
};
```

---

## 7. Hướng dẫn thêm Theme mới

### Bước 1: Thêm derived colors (nếu cần)

Nếu theme mới cần màu ngoài 5 palette, thêm vào `derived` trong `colors.ts`:

```typescript
export const derived = {
  // ... existing
  oceanBlue: '#2E5A7E',   // Ví dụ cho Ocean theme
  oceanSurface: '#3A6A8E',
};
```

### Bước 2: Tạo theme object trong `theme.ts`

```typescript
import { palette, derived, status } from './colors';

export const oceanTheme: Theme = {
  name: 'ocean',
  colors: {
    background: derived.oceanBlue,
    backgroundSecondary: derived.oceanSurface,
    backgroundTertiary: derived.oceanSurface,
    surface: derived.oceanSurface,
    surfaceSecondary: derived.oceanBlue,
    primary: palette.celadon,
    primaryLight: palette.teaGreen,
    primaryDark: palette.fernGreen,
    onPrimary: palette.charcoal,
    secondary: palette.fernGreen,
    secondaryLight: palette.celadon,
    onSecondary: palette.mintCream,
    text: palette.mintCream,
    textSecondary: palette.teaGreen,
    textTertiary: palette.celadon,
    textInverse: palette.charcoal,
    border: palette.fernGreen,
    borderLight: derived.oceanSurface,
    success: palette.celadon,
    successLight: palette.teaGreen,
    error: status.errorLight,
    errorLight: status.errorDark,
    warning: status.warningLight,
    warningLight: status.warning,
    info: status.infoLight,
    infoLight: status.info,
    link: palette.celadon,
    disabled: derived.oceanSurface,
  },
  spacing,         // Dùng chung
  borderRadius,    // Dùng chung
  typography,      // Dùng chung
  shadows: { ... },
};
```

### Bước 3: Export trong `index.ts`

```typescript
export { lightTheme, darkTheme, oceanTheme } from './theme';
```

### Bước 4: Đăng ký trong `ThemeContext.tsx`

Cập nhật `resolveTheme()` để hỗ trợ theme mới:

```typescript
type ThemeMode = 'light' | 'dark' | 'ocean' | 'auto';

const resolveTheme = (mode: ThemeMode): Theme => {
  switch (mode) {
    case 'light': return lightTheme;
    case 'dark': return darkTheme;
    case 'ocean': return oceanTheme;
    case 'auto': return systemScheme === 'dark' ? darkTheme : lightTheme;
  }
};
```

**Không cần sửa bất kỳ screen nào** — tất cả screens tự động nhận theme mới thông qua `useTheme()`.

---

## 8. Checklist khi tạo Screen mới

- [ ] Import `useTheme` từ `'../theme'`
- [ ] Lấy `theme` qua `const { theme } = useTheme()`
- [ ] Background của root View dùng `theme.colors.background`
- [ ] Card/container dùng `theme.colors.surface` + `theme.shadows.md`
- [ ] Text chính dùng `theme.colors.text`
- [ ] Text phụ dùng `theme.colors.textSecondary`
- [ ] Placeholder dùng `theme.colors.textTertiary`
- [ ] Button chính dùng `theme.colors.primary` + `theme.colors.onPrimary`
- [ ] Input background dùng `theme.colors.backgroundSecondary`
- [ ] Border dùng `theme.colors.border`
- [ ] **KHÔNG hardcode bất kỳ màu nào** trong StyleSheet

---

## 9. Sơ đồ quan hệ

```
App.tsx
  └── ThemeProvider          ← Wrap toàn bộ app
        └── AuthProvider
              └── AppNavigator
                    ├── LoginScreen  ← useTheme()
                    ├── HomeScreen   ← useTheme()
                    └── ...Screen    ← useTheme()

colors.ts ────→ theme.ts ────→ ThemeContext.tsx ────→ Screens
(palette)       (lightTheme)    (useTheme hook)       (theme.colors.X)
                (darkTheme)     (toggleTheme)
                (oceanTheme?)   (setThemeMode)
```

---

*Tài liệu này đi kèm source code trong `mobile/src/theme/`. Khi cập nhật theme system, nhớ cập nhật tài liệu tương ứng.*
