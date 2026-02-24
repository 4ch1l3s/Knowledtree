---
name: Mobile Screen Development
description: Quy tắc và patterns khi tạo màn hình mới cho ứng dụng React Native mobile, bao gồm responsive scaling, theme usage, và cấu trúc code.
---

# Mobile Screen Development Skill

Skill này hướng dẫn Agent tuân thủ các quy tắc khi tạo hoặc chỉnh sửa màn hình (screen) trong `mobile/src/screens/`.

---

## Nguyên tắc chung

1. **Tiếng Việt có dấu** — Tất cả comment và UI text phải viết tiếng Việt có dấu đầy đủ
2. **Không dùng icon trong comment** — Không được phép dùng emoji trong comment code
3. **Responsive mặc định** — Mọi giá trị kích thước phải responsive qua theme hoặc scale utility

---

## Responsive Scaling

Dự án sử dụng `react-native-size-matters` để responsive tự động. Scaling được tích hợp sẵn vào theme tokens.

### Quy tắc bắt buộc

| Loại giá trị | Cách dùng | Ví dụ |
|---|---|---|
| **Spacing** (padding, margin) | Dùng `theme.spacing.*` | `theme.spacing.md` |
| **Font size** | Dùng `theme.typography.fontSize*` | `theme.typography.fontSizeMd` |
| **Font weight** | Dùng `theme.typography.fontWeight*` với cast | `theme.typography.fontWeightBold as TextStyle['fontWeight']` |
| **Border radius** | Dùng `theme.borderRadius.*` | `theme.borderRadius.lg` |
| **Colors** | Dùng `theme.colors.*` | `theme.colors.primary` |
| **Shadows** | Spread `theme.shadows.*` | `...theme.shadows.md` |
| **Giá trị custom ngoài theme** | Import `scale` từ `utils` | `scale.s(20)`, `scale.vs(14)`, `scale.ms(22)` |

### KHÔNG ĐƯỢC hardcode pixel values

```typescript
// SAI - pixel cứng, không responsive
const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 24 },
});

// ĐÚNG - dùng theme tokens (đã scale tự động)
const dynamicStyles = {
    container: { padding: theme.spacing.md },
    title: { fontSize: theme.typography.fontSizeXl },
};
```

### Khi nào dùng scale trực tiếp

Chỉ import `scale` từ `../utils/scale` khi giá trị cần **không có trong theme tokens**:

```typescript
import { scale } from '../utils/scale';

// Chỉ dùng cho giá trị custom
const dynamicStyles = {
    // scale.s() cho kích thước ngang/chung
    customGap: { marginBottom: scale.vs(20) },
    // scale.vs() cho kích thước dọc
    customPadding: { paddingVertical: scale.vs(14) },
    // scale.ms() cho font size custom
    customFont: { fontSize: scale.ms(22) },
};
```

---

## Cấu trúc Screen

### Template chuẩn

```typescript
import React from 'react';
import { View, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme';
// Chỉ import scale khi cần giá trị custom ngoài theme
// import { scale } from '../utils/scale';

const MyScreen = () => {
    const { theme } = useTheme();

    // Style động sử dụng theme tokens (đã được scale tự động)
    const dynamicStyles = {
        container: {
            flex: 1,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        title: {
            fontSize: theme.typography.fontSizeXl,
            fontWeight: theme.typography.fontWeightBold as TextStyle['fontWeight'],
            color: theme.colors.text,
        },
    };

    return (
        <View style={dynamicStyles.container}>
            <Text style={dynamicStyles.title}>Tiêu đề</Text>
        </View>
    );
};

export default MyScreen;
```

### Quy tắc cấu trúc

1. **Import `useTheme`** từ `../theme` — không import trực tiếp từ `ThemeContext`
2. **Dùng dynamic styles** thay vì `StyleSheet.create` — vì styles phụ thuộc theme (có thể đổi light/dark)
3. **Cast fontWeight** — luôn cast `theme.typography.fontWeight*` thành `TextStyle['fontWeight']`
4. **Spread shadows** — dùng `...theme.shadows.md` trong style object

---

## Theme Tokens có sẵn

### Spacing (đã scale bằng `s()`)
`xs(4)` · `sm(8)` · `md(16)` · `lg(24)` · `xl(32)` · `xxl(48)`

### Font Size (đã scale bằng `ms(0.15)`)
`fontSizeXs(12)` · `fontSizeSm(14)` · `fontSizeMd(16)` · `fontSizeLg(18)` · `fontSizeXl(24)` · `fontSizeXxl(32)`

### Font Weight
`fontWeightRegular('400')` · `fontWeightMedium('500')` · `fontWeightBold('700')`

### Border Radius (đã scale bằng `s()`)
`sm(4)` · `md(8)` · `lg(12)` · `xl(16)` · `full(9999)`

### Scale Utility (cho giá trị custom)
- `scale.s(n)` — kích thước ngang/chung
- `scale.vs(n)` — kích thước dọc
- `scale.ms(n)` — font size (hệ số nhỹ 0.15)

---

## Checklist khi tạo screen mới

- [ ] Import `useTheme` từ `../theme`
- [ ] Dùng dynamic styles thay vì `StyleSheet.create`
- [ ] Tất cả spacing dùng `theme.spacing.*`
- [ ] Tất cả font size dùng `theme.typography.fontSize*`
- [ ] Tất cả font weight cast thành `TextStyle['fontWeight']`
- [ ] Tất cả border radius dùng `theme.borderRadius.*`
- [ ] Tất cả colors dùng `theme.colors.*`
- [ ] Không có pixel values hardcoded
- [ ] Comment và UI text viết tiếng Việt có dấu
- [ ] Không dùng emoji trong comment
