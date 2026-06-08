import DeviceInfo from 'react-native-device-info';

export async function getDeviceHwid() {
  const uniqueId = await DeviceInfo.getUniqueId();

  if (!uniqueId) {
    throw new Error('Não foi possível identificar este dispositivo.');
  }

  return uniqueId;
}
