import { Platform } from 'react-native';

// Knowledtree.Web runs on port 44353 (HTTPS)
const API_PORT = 5000;

// Android Emulator sees host machine as 10.0.2.2
// iOS Simulator / Physical connected usually uses localhost (if port forwarded) or LAN IP
// For now, dev focus on Emulator/Simulator
const API_HOST = Platform.OS === 'android' ? '192.168.1.8' : 'localhost';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
