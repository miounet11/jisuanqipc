# 专业科学计算器 📱

一个功能强大、精度高、用户体验优秀的React Native科学计算器应用。

[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-49.0-black.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📱 应用特性

### 🧮 多种计算模式
- **基础计算器**: 四则运算、百分比、内存功能
- **科学计算器**: 三角函数、对数、指数、双曲函数
- **图形计算器**: 函数绘图、零点查找、极值分析
- **几何计算器**: 图形面积、周长、体积计算
- **方程求解器**: 线性、二次、多项式方程求解
- **逻辑计算器**: 布尔运算、位运算、真值表
- **表达式简化器**: 代数化简、求导、积分
- **二项式展开器**: 二项式定理、帕斯卡三角形
- **矩阵计算器**: 矩阵运算、行列式、逆矩阵

### 🎨 用户界面
- **现代化设计**: 简洁直观的用户界面
- **主题支持**: 亮色/暗色主题，支持系统自动切换
- **响应式布局**: 适配不同屏幕尺寸和方向
- **触觉反馈**: 支持震动和声音反馈
- **动画效果**: 流畅的过渡动画和交互效果

### 📊 数据管理
- **历史记录**: 保存计算历史，支持搜索和管理
- **数据持久化**: 设置和数据本地存储
- **导入导出**: 支持数据备份和恢复
- **多格式支持**: 支持多种数值显示格式

### ⚙️ 个性化设置
- **精度控制**: 可调节计算精度和小数位数
- **角度单位**: 支持度数和弧度模式切换
- **显示格式**: 科学计数法、千位分隔符等
- **字体大小**: 可调节显示字体大小
- **按钮样式**: 圆形/方形按钮样式选择

## 🚀 技术架构

### 核心技术栈
- **React Native 0.72+**: 跨平台移动应用框架
- **TypeScript 5.0**: 类型安全的JavaScript超集
- **Decimal.js**: 高精度数学计算库
- **React Native SVG**: 图形绘制支持
- **AsyncStorage**: 数据持久化存储
- **React Navigation**: 应用导航管理

### 架构特点
- **模块化设计**: 每个计算器功能独立模块
- **SOLID原则**: 遵循面向对象设计原则
- **TDD开发**: 测试驱动的开发模式
- **性能优化**: 记忆化缓存、懒加载等优化技术
- **类型安全**: 完整的TypeScript类型系统

### 项目结构
```
src/
├── components/          # 可复用UI组件
│   ├── Display/        # 计算器显示屏组件
│   ├── Button/         # 按钮组件
│   └── Keypad/         # 键盘组件
├── modules/            # 计算器模块
│   ├── basic/          # 基础计算器
│   ├── scientific/     # 科学计算器
│   ├── graphing/       # 图形计算器
│   ├── geometry/       # 几何计算器
│   ├── equation/       # 方程求解器
│   ├── logic/          # 逻辑计算器
│   ├── expression/     # 表达式简化器
│   ├── binomial/       # 二项式展开器
│   └── matrix/         # 矩阵计算器
├── services/           # 业务逻辑服务
│   ├── CalculatorService.ts   # 计算服务
│   ├── StorageService.ts      # 存储服务
│   └── GraphRenderer.ts       # 图形渲染服务
├── models/             # 数据模型
│   ├── Expression.ts   # 表达式模型
│   ├── Result.ts       # 结果模型
│   ├── History.ts      # 历史记录模型
│   ├── Settings.ts     # 设置模型
│   └── Graph.ts        # 图形模型
├── utils/              # 工具函数
│   ├── math.ts         # 数学工具函数
│   ├── validation.ts   # 验证工具函数
│   └── performance.ts  # 性能优化工具
├── types/              # 类型定义
├── navigation/         # 导航配置
└── App.tsx            # 应用入口
```

## 🛠️ 开发环境设置

### 环境要求
- Node.js 18+
- React Native CLI
- Android Studio (Android开发)
- Xcode (iOS开发)
- TypeScript 5.0+

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd shouji

# 安装依赖
npm install

# iOS额外步骤
cd ios && pod install && cd ..
```

### 开发命令
```bash
# 启动Metro服务器
npm start

# 运行Android版本
npm run android

# 运行iOS版本
npm run ios

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 运行测试
npm run test

# 运行集成测试
npm run test:integration

# 构建生产版本
npm run build:android
npm run build:ios
```

## 🧪 测试策略

### 测试层级
- **单元测试**: 测试工具函数和模型
- **集成测试**: 测试服务和模块交互
- **E2E测试**: 测试完整用户流程

### 测试覆盖率
- 目标覆盖率: 90%+
- 工具函数: 100%覆盖
- 服务层: 95%覆盖
- 组件层: 85%覆盖

### 运行测试
```bash
# 所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e

# 测试覆盖率报告
npm run test:coverage
```

## 📈 性能优化

### 计算性能
- **记忆化缓存**: 常用计算结果缓存
- **批量处理**: 大量计算的批量优化
- **懒加载**: 按需加载复杂计算模块
- **精度控制**: 可配置的计算精度

### UI性能
- **虚拟化**: 长列表虚拟化渲染
- **防抖节流**: 用户输入优化
- **动画优化**: 使用原生动画引擎
- **内存管理**: 智能内存回收

### 启动性能
- **代码分割**: 按功能模块分割代码
- **预加载**: 预加载常用功能
- **资源优化**: 图片和字体资源优化

## 🔧 配置说明

### 环境配置
```typescript
// .env
API_URL=https://api.example.com
DEBUG_MODE=true
ANALYTICS_ENABLED=false
```

### 应用配置
```typescript
// src/config/app.ts
export const AppConfig = {
  version: '1.0.0',
  supportEmail: 'support@example.com',
  website: 'https://example.com',
  defaultSettings: {
    theme: 'auto',
    precision: 'high',
    angleUnit: 'degree',
  },
};
```

## 📱 部署指南

### Android部署
```bash
# 生成签名密钥
keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 构建APK
npm run build:android

# 构建Bundle
npm run build:android:bundle
```

### iOS部署
```bash
# 确保证书配置正确
# 在Xcode中配置签名

# 构建存档
npm run build:ios

# 上传到App Store Connect
# 使用Xcode Organizer或Transporter
```

### 发布检查清单
- [ ] 版本号更新
- [ ] 更新日志编写
- [ ] 测试通过
- [ ] 性能基准测试
- [ ] 安全审查
- [ ] 应用图标和截图准备
- [ ] 应用商店描述

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint配置
- 使用Prettier格式化代码
- 编写单元测试
- 提交消息遵循Conventional Commits

### 提交规范
```
type(scope): subject

body

footer
```

类型包括：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持和帮助

### 问题报告
- [GitHub Issues](https://github.com/example/shouji/issues)
- 提供详细的重现步骤
- 包含设备和系统信息
- 附加错误日志和截图

### 功能请求
- 通过GitHub Issues提交
- 详细描述功能需求
- 说明使用场景
- 提供设计建议

### 常见问题

**Q: 应用启动缓慢怎么办？**
A: 尝试清除应用缓存，重启设备，或重新安装应用。

**Q: 计算结果不准确？**
A: 检查设置中的精度配置，确保使用适当的计算模式。

**Q: 如何备份我的数据？**
A: 在设置中使用导出功能，将数据保存到文件。

**Q: 支持哪些数学函数？**
A: 支持基础运算、三角函数、对数、指数、统计函数等，详见功能列表。

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- 🎉 初始版本发布
- ✨ 基础和科学计算功能
- 🎨 现代化用户界面
- 📱 支持iOS和Android
- 🧪 完整测试覆盖

### 计划更新
- 🔄 云同步功能
- 📊 更多图形类型
- 🧮 自定义函数
- 🌐 多语言支持
- 🎓 教学模式

---

**开发团队**: Claude Code Assistant
**最后更新**: 2024-01-01
**版本**: 1.0.0