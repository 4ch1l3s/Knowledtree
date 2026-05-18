import { Platform } from 'react-native';

// Kairos Garden backend chạy ở port 5000 (HTTP)
const API_PORT = 5000;

// Emulator
const API_HOST = '10.0.2.2';

// Physical device 
// const API_HOST = '192.168.1.180';


export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
