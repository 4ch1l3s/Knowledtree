import { Platform } from 'react-native';

// Kairos Garden backend chạy ở port 5000 (HTTP)
const API_PORT = 5000;

// Android Emulator sees host machine as 10.0.2.2
// iOS Simulator / Physical connected usually uses localhost (if port forwarded) or LAN IP
// For now, dev focus on Emulator/Simulator
const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
