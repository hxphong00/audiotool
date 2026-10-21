// Test mock for react-native in headless Node.js test environment
export const NativeModules = {};
export const Platform = { OS: 'ios', select: (objs: any) => objs.ios || objs.default };
export const StyleSheet = { create: (s: any) => s };
export default { NativeModules, Platform, StyleSheet };
