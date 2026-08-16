import { Platform } from 'react-native';

const DEVELOPMENT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

const STAGING_API_BASE_URL = 'https://kairosgarden-staging.onrender.com';

export const API_BASE_URL = __DEV__
  ? DEVELOPMENT_API_BASE_URL
  : STAGING_API_BASE_URL;
