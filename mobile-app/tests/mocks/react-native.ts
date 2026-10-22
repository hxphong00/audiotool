// Test mock for react-native in headless Node.js test environment
export const NativeModules = {};
export const Platform = { OS: 'ios', select: (objs: any) => objs.ios || objs.default };
export const StyleSheet = {
  hairlineWidth: 0.5,
  create: (s: any) => s,
};
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const ActivityIndicator = 'ActivityIndicator';
export const StatusBar = 'StatusBar';
export const SafeAreaView = 'SafeAreaView';
export const Alert = { alert: () => {} };

export default {
  NativeModules,
  Platform,
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
};
