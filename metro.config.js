const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加路径解析配置
config.resolver.alias = {
  '@': './src',
};

// 支持更多文件扩展名
config.resolver.sourceExts.push('svg');

module.exports = config;