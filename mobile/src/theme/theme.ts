import { palette, derived, status } from './colors';
import { scale } from '../utils/scale';

// ─── Theme Interface ──────────────────────────────────────────
// Đây là "hợp đồng" giữa theme và screens.
// Screens chỉ dùng các tên semantic bên dưới, không bao giờ import trực tiếp từ colors.ts.
// Khi tạo theme mới, chỉ cần tạo object conform interface này.

export interface Theme {
    name: string;
    colors: {
        background: string;
        backgroundSecondary: string;
        backgroundTertiary: string;
        surface: string;
        surfaceSecondary: string;
        primary: string;
        primaryLight: string;
        primaryDark: string;
        onPrimary: string;
        secondary: string;
        secondaryLight: string;
        onSecondary: string;
        text: string;
        textSecondary: string;
        textTertiary: string;
        textInverse: string;
        border: string;
        borderLight: string;
        success: string;
        successLight: string;
        error: string;
        errorLight: string;
        warning: string;
        warningLight: string;
        info: string;
        infoLight: string;
        link: string;
        disabled: string;
    };
    spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    borderRadius: {
        sm: number;
        md: number;
        lg: number;
        xl: number;
        full: number;
    };
    typography: {
        fontSizeXs: number;
        fontSizeSm: number;
        fontSizeMd: number;
        fontSizeLg: number;
        fontSizeXl: number;
        fontSizeXxl: number;
        fontWeightRegular: string;
        fontWeightMedium: string;
        fontWeightBold: string;
    };
    shadows: {
        sm: object;
        md: object;
        lg: object;
    };
}

// ─── Layout Tokens (shared) ──────────────────────────────────
// Không đổi giữa các theme

const spacing = {
    xs: scale.s(4),
    sm: scale.s(8),
    md: scale.s(16),
    lg: scale.s(24),
    xl: scale.s(32),
    xxl: scale.s(48),
};

const borderRadius = {
    sm: scale.s(4),
    md: scale.s(8),
    lg: scale.s(12),
    xl: scale.s(16),
    full: 9999,
};

const typography = {
    fontSizeXs: scale.ms(12),
    fontSizeSm: scale.ms(14),
    fontSizeMd: scale.ms(16),
    fontSizeLg: scale.ms(18),
    fontSizeXl: scale.ms(24),
    fontSizeXxl: scale.ms(32),
    fontWeightRegular: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
};

// ─── Light Theme ──────────────────────────────────────────────
// Background: Tea Green (#CCFCCB)
// Surface (cards): Mint Cream (#F1FFFA) - nổi bật trên nền xanh nhạt

export const lightTheme: Theme = {
    name: 'light',
    colors: {
        background: palette.teaGreen,          // #CCFCCB
        backgroundSecondary: palette.mintCream, // #F1FFFA
        backgroundTertiary: palette.mintCream,  // #F1FFFA
        surface: palette.mintCream,             // #F1FFFA
        surfaceSecondary: palette.teaGreen,     // #CCFCCB

        primary: palette.fernGreen,             // #568259
        primaryLight: palette.celadon,          // #96E6B3
        primaryDark: derived.deepForest,        // #3D5A40
        onPrimary: palette.mintCream,           // #F1FFFA

        secondary: palette.celadon,             // #96E6B3
        secondaryLight: palette.teaGreen,       // #CCFCCB
        onSecondary: palette.charcoal,          // #464947

        text: palette.charcoal,                 // #464947
        textSecondary: palette.fernGreen,       // #568259
        textTertiary: palette.celadon,          // #96E6B3
        textInverse: palette.mintCream,         // #F1FFFA

        border: palette.celadon,                // #96E6B3
        borderLight: palette.teaGreen,          // #CCFCCB

        success: palette.fernGreen,             // #568259
        successLight: palette.celadon,          // #96E6B3
        error: status.error,                    // #EF4444
        errorLight: status.errorLight,          // #FCA5A5
        warning: status.warning,               // #F59E0B
        warningLight: status.warningLight,      // #FCD34D
        info: status.info,                      // #3B82F6
        infoLight: status.infoLight,            // #93C5FD

        link: palette.fernGreen,                // #568259
        disabled: palette.celadon,              // #96E6B3
    },

    spacing,
    borderRadius,
    typography,

    shadows: {
        sm: {
            shadowColor: palette.charcoal,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: palette.charcoal,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: palette.charcoal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
        },
    },
};

// ─── Dark Theme ──────────────────────────────────────────────
// Background: Dark green (#464E47)
// Surface (cards): Darker fern (#526556) - subtle contrast
// Text/accents dùng các màu sáng từ palette

export const darkTheme: Theme = {
    name: 'dark',
    colors: {
        background: derived.darkBg,             // #464E47
        backgroundSecondary: derived.darkSurfaceAlt, // #4A5A4D
        backgroundTertiary: derived.darkSurface, // #526556
        surface: derived.darkSurface,            // #526556
        surfaceSecondary: derived.darkSurfaceAlt, // #4A5A4D

        primary: palette.celadon,                // #96E6B3 (sáng hơn trên nền tối)
        primaryLight: palette.teaGreen,          // #CCFCCB
        primaryDark: palette.fernGreen,          // #568259
        onPrimary: palette.charcoal,             // #464947

        secondary: palette.fernGreen,            // #568259
        secondaryLight: palette.celadon,         // #96E6B3
        onSecondary: palette.mintCream,          // #F1FFFA

        text: palette.mintCream,                 // #F1FFFA
        textSecondary: palette.teaGreen,         // #CCFCCB
        textTertiary: palette.celadon,           // #96E6B3
        textInverse: palette.charcoal,           // #464947

        border: palette.fernGreen,               // #568259
        borderLight: derived.darkSurface,        // #526556

        success: palette.celadon,                // #96E6B3
        successLight: palette.teaGreen,          // #CCFCCB
        error: status.errorLight,                // #FCA5A5 (sáng hơn trên nền tối)
        errorLight: status.errorDark,            // #6B2020
        warning: status.warningLight,            // #FCD34D
        warningLight: status.warning,            // #F59E0B
        info: status.infoLight,                  // #93C5FD
        infoLight: status.info,                  // #3B82F6

        link: palette.celadon,                   // #96E6B3
        disabled: derived.darkSurfaceAlt,        // #4A5A4D
    },

    spacing,
    borderRadius,
    typography,

    shadows: {
        sm: {
            shadowColor: derived.darkBg,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: derived.darkBg,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: derived.darkBg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
        },
    },
};

// Default export = light theme
export default lightTheme;
