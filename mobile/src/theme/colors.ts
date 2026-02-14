/**
 * Bảng màu gốc - 5 màu core từ thiết kế
 * Tất cả theme colors phải được derive từ đây
 */
export const palette = {
    mintCream: '#F1FFFA',   // Sáng nhất
    teaGreen: '#CCFCCB',    // Sáng
    celadon: '#96E6B3',     // Trung bình
    fernGreen: '#568259',   // Tối
    charcoal: '#464947',    // Tối nhất
};

/**
 * Màu mở rộng - derive từ palette cho dark mode
 * Giữ tông xanh lá thống nhất, không dùng gray/black thuần
 */
export const derived = {
    darkBg: '#464E47',       // Dark mode background (charcoal + green tint)
    darkSurface: '#526556',  // Dark mode surface (giữa charcoal và fernGreen)
    darkSurfaceAlt: '#4A5A4D', // Dark mode surface variant
    deepForest: '#3D5A40',   // Phiên bản tối hơn của fernGreen
};

/**
 * Màu trạng thái - giữ chuẩn UX (đỏ/vàng/xanh dương)
 * Không thay đổi theo theme vì cần nhận biết ngay lập tức
 */
export const status = {
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorDark: '#6B2020',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    info: '#3B82F6',
    infoLight: '#93C5FD',
};
