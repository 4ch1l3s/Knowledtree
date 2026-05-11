import { Platform } from 'react-native';

// Kairos Garden backend chạy ở port 5000 (HTTP)
const API_PORT = 5000;

// For now, dev focus on physical device over WiFi
const API_HOST = '192.168.1.180';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
