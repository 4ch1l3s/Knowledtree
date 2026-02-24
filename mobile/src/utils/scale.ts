import { s, vs, ms } from 'react-native-size-matters';

// Các hàm scale responsive cho UI
// Screens KHÔNG nên import trực tiếp từ file này — dùng theme tokens thay thế
// Chỉ import trực tiếp khi cần giá trị custom ngoài theme

export const scale = {
    // Scale theo chiều ngang / kích thước chung
    s,
    // Scale theo chiều dọc
    vs,
    // Scale với hệ số nhẹ (0.15) — dùng cho font size để tránh text quá to/nhỏ
    ms: (size: number) => ms(size, 0.15),
};
