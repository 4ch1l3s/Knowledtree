import { Dimensions } from 'react-native';

// ── Breakpoint-based scaling ──────────────────────────────────
// Phân loại màn hình thành 4 kích cỡ, mỗi cỡ có 1 scale factor cố định.
// Baseline = medium (360–413dp), tương đương iPhone SE / Android phổ biến.

const { width } = Dimensions.get('window');

type Breakpoint = 'small' | 'medium' | 'large' | 'xlarge';

const breakpoint: Breakpoint =
    width < 360 ? 'small' :
        width < 414 ? 'medium' :
            width < 768 ? 'large' :
                'xlarge';

const factors: Record<Breakpoint, number> = {
    small: 0.85,
    medium: 1.0,
    large: 1.1,
    xlarge: 1.25,
};

const factor = factors[breakpoint];

// ── Public API (giữ nguyên interface cũ) ──────────────────────
export const scale = {
    /** Scale theo chiều ngang / kích thước chung */
    s: (size: number) => Math.round(size * factor),
    /** Scale theo chiều dọc (cùng factor cho đơn giản) */
    vs: (size: number) => Math.round(size * factor),
    /** Scale nhẹ cho font — factor gần 1 hơn để text không quá to/nhỏ */
    ms: (size: number) => Math.round(size * (1 + (factor - 1) * 0.3)),

    /** Chọn giá trị cụ thể cho từng breakpoint */
    value: <T>(sm: T, md: T, lg: T, xl: T): T => {
        switch (breakpoint) {
            case 'small': return sm;
            case 'medium': return md;
            case 'large': return lg;
            case 'xlarge': return xl;
        }
    },

    /** Breakpoint hiện tại (debug/logging) */
    current: breakpoint,
    /** Factor hiện tại */
    factor,
};
