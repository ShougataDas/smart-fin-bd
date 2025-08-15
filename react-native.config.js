module.exports = {
  // Disable platform-specific setup in WebContainer
  platforms: {
    web: {
      // Web platform configuration for WebContainer
      bundler: 'metro',
    },
  },
  
  // Skip native dependencies that won't work in WebContainer
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    'react-native-reanimated': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
  
  // Metro configuration
  resolver: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@screens': './src/screens',
      '@services': './src/services',
      '@store': './src/store',
      '@types': './src/types',
      '@utils': './src/utils',
      '@constants': './src/constants',
      '@hooks': './src/hooks',
      '@assets': './assets',
    },
  },
};