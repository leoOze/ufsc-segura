import * as SecureStore from 'expo-secure-store';

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
  try {
    // react-native-device-info is not available inside Expo Go. Requiring it
    // lazily keeps the app from crashing before we can use a dev fallback.
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
