// Theme system exports
// Screens chỉ cần import từ đây, không import trực tiếp từ các file con

export { palette, derived, status } from './colors';
export { lightTheme, darkTheme } from './theme';
export type { Theme } from './theme';
export { ThemeProvider, ThemeContext, useTheme } from './ThemeContext';
