import React from 'react';

export const Ionicons = Object.assign(
  (props: any) => React.createElement('Ionicons', props),
  { glyphMap: {} }
);

export const BlurView = (props: any) =>
  React.createElement('BlurView', props, props.children);

export const SafeAreaProvider = (props: any) =>
  React.createElement('SafeAreaProvider', props, props.children);

export const SafeAreaView = (props: any) =>
  React.createElement('SafeAreaView', props, props.children);

export function useSafeAreaInsets() {
  return { top: 47, bottom: 34, left: 0, right: 0 };
}

export const GestureHandlerRootView = (props: any) =>
  React.createElement('GestureHandlerRootView', props, props.children);

const BottomSheet = React.forwardRef((props: any, _ref: any) =>
  React.createElement('BottomSheet', props, props.children)
);

export const BottomSheetBackdrop = (props: any) =>
  React.createElement('BottomSheetBackdrop', props);

export const BottomSheetView = (props: any) =>
  React.createElement('BottomSheetView', props, props.children);

export async function activateKeepAwakeAsync() {}
export async function deactivateKeepAwake() {}

export const documentDirectory = 'file:///mock/documents/';
export async function getInfoAsync() {
  return { exists: false };
}
export async function makeDirectoryAsync() {}
export async function downloadAsync() {
  return { uri: 'file:///mock/audio.mp3' };
}
export async function writeAsStringAsync() {}
export async function readAsStringAsync() {
  return '{}';
}
export async function deleteAsync() {}

export default BottomSheet;
