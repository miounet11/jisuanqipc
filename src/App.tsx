/**
 * Main App Component
 *
 * 应用主入口，提供全局状态管理和主题配置
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform,
  Appearance,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from '@/navigation/AppNavigator';
import { StorageService } from '@/services/StorageService';
import { Settings } from '@/types/Settings';

// 全局状态类型
interface AppState {
  theme: 'light' | 'dark' | 'auto';
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

// 应用上下文类型
interface AppContextType {
  state: AppState;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => void;
  updateSettings: (settings: Partial<Settings>) => void;
  clearError: () => void;
}

// 创建应用上下文
const AppContext = createContext<AppContextType | undefined>(undefined);

// 应用上下文 Hook
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// 默认设置
const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  theme: 'auto',
  scientificMode: false,
  angleUnit: 'degree',
  decimalPlaces: 8,
  thousandsSeparator: true,
  vibrationEnabled: true,
  soundEnabled: false,
  historyEnabled: true,
  maxHistoryItems: 100,
  fontSize: 'medium',
  buttonStyle: 'rounded',
  autoSave: true,
  precision: 'high',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 应用提供者组件
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    theme: 'auto',
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    error: null,
  });

  // 初始化应用
  const initializeApp = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 初始化存储服务
      await StorageService.initialize();

      // 加载用户设置
      const savedSettings = await StorageService.getSettings();
      const settings = savedSettings || DEFAULT_SETTINGS;

      // 确定主题
      let theme = settings.theme;
      if (theme === 'auto') {
        theme = Appearance.getColorScheme() || 'light';
      }

      setState(prev => ({
        ...prev,
        theme: theme as 'light' | 'dark',
        settings,
        isLoading: false,
      }));

      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '应用初始化失败',
        isLoading: false,
      }));
    }
  };

  // 更新主题
  const updateTheme = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      const updatedSettings = { ...state.settings, theme: newTheme };
      await StorageService.saveSettings(updatedSettings);

      let actualTheme = newTheme;
      if (newTheme === 'auto') {
        actualTheme = Appearance.getColorScheme() || 'light';
      }

      setState(prev => ({
        ...prev,
        theme: actualTheme as 'light' | 'dark',
        settings: updatedSettings,
      }));
    } catch (error) {
      console.error('Failed to update theme:', error);
      setState(prev => ({
        ...prev,
        error: '更新主题失败',
      }));
    }
  };

  // 更新设置
  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = {
        ...state.settings,
        ...newSettings,
        updatedAt: new Date(),
      };

      await StorageService.saveSettings(updatedSettings);

      setState(prev => ({
        ...prev,
        settings: updatedSettings,
      }));
    } catch (error) {
      console.error('Failed to update settings:', error);
      setState(prev => ({
        ...prev,
        error: '更新设置失败',
      }));
    }
  };

  // 清除错误
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // 监听系统主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (state.settings.theme === 'auto') {
        setState(prev => ({
          ...prev,
          theme: colorScheme || 'light',
        }));
      }
    });

    return () => subscription?.remove();
  }, [state.settings.theme]);

  // 应用启动时初始化
  useEffect(() => {
    initializeApp();
  }, []);

  // 错误处理
  useEffect(() => {
    if (state.error) {
      Alert.alert(
        '错误',
        state.error,
        [{ text: '确定', onPress: clearError }]
      );
    }
  }, [state.error]);

  const contextValue: AppContextType = {
    state,
    updateTheme,
    updateSettings,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 主应用组件
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </GestureHandlerRootView>
  );
};

// 应用内容组件
const AppContent: React.FC = () => {
  const { state } = useAppContext();

  // 根据主题设置状态栏
  const statusBarStyle = state.theme === 'dark' ? 'light-content' : 'dark-content';
  const statusBarBackgroundColor = state.theme === 'dark' ? '#000000' : '#ffffff';

  if (state.isLoading) {
    // 可以在这里添加加载界面
    return null;
  }

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: state.theme === 'dark' ? '#000000' : '#ffffff' }
    ]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent={false}
      />
      <AppNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },
});

export default App;