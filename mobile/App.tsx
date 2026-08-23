import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { LocalizationProvider } from './src/localization';
import { StrictModeProvider } from './src/context/StrictModeContext';

const App = () => {
  return (
    <LocalizationProvider>
      <ThemeProvider>
        <StrictModeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </StrictModeProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;
