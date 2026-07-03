import * as SecureStore from 'expo-secure-store';
import { NativeModules } from 'react-native';

const FALLBACK_DEVICE_ID_KEY = 'ufsc_segura_fallback_device_id';

function createFallbackDeviceId() {
  return `expo-go-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getFallbackDeviceId() {
  const storedId = await SecureStore.getItemAsync(FALLBACK_DEVICE_ID_KEY);

  if (storedId) {
    return storedId;
  }

  const newId = createFallbackDeviceId();
  await SecureStore.setItemAsync(FALLBACK_DEVICE_ID_KEY, newId);

  return newId;
}

async function getNativeDeviceId() {
  if (!NativeModules.RNDeviceInfo) {
    return '';
  }

  try {
    const DeviceInfo = require('react-native-device-info').default;
    const uniqueId = await DeviceInfo.getUniqueId();

    return uniqueId ? `device-info-${uniqueId}` : '';
  } catch {
    return '';
  }
}

export async function getDeviceHwid() {
  const nativeDeviceId = await getNativeDeviceId();

  if (nativeDeviceId) {
    return nativeDeviceId;
  }

  return getFallbackDeviceId();
}
