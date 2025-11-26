import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationsService } from './src/services/notificationsService';
import './global.css';

const App = () => {
  useEffect(() => {
    const initNotifications = async () => {
      await notificationsService.requestPermission();
      await notificationsService.init();
    };
    initNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
