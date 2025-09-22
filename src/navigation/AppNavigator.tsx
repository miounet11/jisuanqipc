/**
 * App Navigator
 *
 * 应用主导航组件，管理各计算器模块之间的导航
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import {
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native';

// 导入计算器模块
import { BasicCalculator } from '@/modules/basic/BasicCalculator';
import { ScientificCalculator } from '@/modules/scientific/ScientificCalculator';
import { GraphingCalculator } from '@/modules/graphing/GraphingCalculator';
import { GeometryCalculator } from '@/modules/geometry/GeometryCalculator';
import { EquationSolver } from '@/modules/equation/EquationSolver';
import { LogicCalculator } from '@/modules/logic/LogicCalculator';
import { ExpressionSimplifier } from '@/modules/expression/ExpressionSimplifier';
import { BinomialExpander } from '@/modules/binomial/BinomialExpander';
import { MatrixCalculator } from '@/modules/matrix/MatrixCalculator';

// 创建导航器
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 类型定义
export type RootTabParamList = {
  Basic: undefined;
  Scientific: undefined;
  Graphing: undefined;
  Advanced: undefined;
  Tools: undefined;
};

export type AdvancedStackParamList = {
  AdvancedHome: undefined;
  Geometry: undefined;
  Equation: undefined;
  Matrix: undefined;
};

export type ToolsStackParamList = {
  ToolsHome: undefined;
  Logic: undefined;
  Expression: undefined;
  Binomial: undefined;
};

// 图标组件
const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  const getIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      Basic: '🔢',
      Scientific: '📐',
      Graphing: '📊',
      Advanced: '🧮',
      Tools: '🛠️',
    };
    return icons[iconName] || '📱';
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabIconText, { color }]}>
        {getIcon(name)}
      </Text>
    </View>
  );
};

// 高级计算器主页
const AdvancedHome: React.FC = () => {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeTitle}>高级计算器</Text>
      <View style={styles.homeGrid}>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>📐</Text>
          <Text style={styles.cardTitle}>几何计算</Text>
          <Text style={styles.cardDescription}>图形面积、周长计算</Text>
        </View>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>方程求解</Text>
          <Text style={styles.cardDescription}>线性、二次方程求解</Text>
        </View>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>🔲</Text>
          <Text style={styles.cardTitle}>矩阵计算</Text>
          <Text style={styles.cardDescription}>矩阵运算、行列式</Text>
        </View>
      </View>
    </View>
  );
};

// 工具主页
const ToolsHome: React.FC = () => {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeTitle}>计算工具</Text>
      <View style={styles.homeGrid}>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>🔣</Text>
          <Text style={styles.cardTitle}>逻辑运算</Text>
          <Text style={styles.cardDescription}>布尔代数、位运算</Text>
        </View>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>表达式简化</Text>
          <Text style={styles.cardDescription}>代数化简、求导</Text>
        </View>
        <View style={styles.homeCard}>
          <Text style={styles.cardIcon}>📈</Text>
          <Text style={styles.cardTitle}>二项式展开</Text>
          <Text style={styles.cardDescription}>帕斯卡三角、组合</Text>
        </View>
      </View>
    </View>
  );
};

// 高级计算器栈导航
const AdvancedStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AdvancedHome"
        component={AdvancedHome}
        options={{ title: '高级计算器' }}
      />
      <Stack.Screen
        name="Geometry"
        component={GeometryCalculator}
        options={{ title: '几何计算器' }}
      />
      <Stack.Screen
        name="Equation"
        component={EquationSolver}
        options={{ title: '方程求解器' }}
      />
      <Stack.Screen
        name="Matrix"
        component={MatrixCalculator}
        options={{ title: '矩阵计算器' }}
      />
    </Stack.Navigator>
  );
};

// 工具栈导航
const ToolsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#34C759',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ToolsHome"
        component={ToolsHome}
        options={{ title: '计算工具' }}
      />
      <Stack.Screen
        name="Logic"
        component={LogicCalculator}
        options={{ title: '逻辑计算器' }}
      />
      <Stack.Screen
        name="Expression"
        component={ExpressionSimplifier}
        options={{ title: '表达式简化器' }}
      />
      <Stack.Screen
        name="Binomial"
        component={BinomialExpander}
        options={{ title: '二项式展开器' }}
      />
    </Stack.Navigator>
  );
};

// 主标签导航
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#f2f2f7',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Basic"
        component={BasicCalculator}
        options={{
          tabBarLabel: '基础',
          title: '基础计算器',
        }}
      />
      <Tab.Screen
        name="Scientific"
        component={ScientificCalculator}
        options={{
          tabBarLabel: '科学',
          title: '科学计算器',
        }}
      />
      <Tab.Screen
        name="Graphing"
        component={GraphingCalculator}
        options={{
          tabBarLabel: '图形',
          title: '图形计算器',
        }}
      />
      <Tab.Screen
        name="Advanced"
        component={AdvancedStack}
        options={{
          tabBarLabel: '高级',
          title: '高级计算器',
        }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsStack}
        options={{
          tabBarLabel: '工具',
          title: '计算工具',
        }}
      />
    </Tab.Navigator>
  );
};

// 主导航容器
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },

  tabIconText: {
    fontSize: 20,
  },

  homeContainer: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    padding: 20,
  },

  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },

  homeGrid: {
    flex: 1,
    justifyContent: 'center',
  },

  homeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AppNavigator;