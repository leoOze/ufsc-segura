import Constants from 'expo-constants';
import { router } from 'expo-router';
import { deleteToken, getToken } from './authStorage';

function getApiUrl() {
  const configuredApiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl;

  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/+$/, '');
  }

  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

  if (!isDev) {
    throw new Error('Configure EXPO_PUBLIC_API_URL com a URL do servidor em producao.');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3000`;
  }

  return 'http://127.0.0.1:3000';
}

export const API_URL = getApiUrl();

class ApiAuthError extends Error {
  constructor(message = 'Sessao expirada. Entre novamente.') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

async function handleUnauthorized() {
  await deleteToken();
  router.replace('/login');
}

async function parseResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function getAuthHeaders() {
  const token = await getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.auth) {
    Object.assign(headers, await getAuthHeaders());
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseResponseJson(response);

  if (response.status === 401) {
    await handleUnauthorized();
    throw new ApiAuthError(data.error);
  }

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisicao');
  }

  return data;
}

export function login(loginValue, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue, password }),
  });
}

export function getCurrentUser() {
  return request('/me', {
    auth: true,
  });
}

export function register(loginValue, password, hwid) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ hwid, login: loginValue, password }),
  });
}

export function getReports() {
  return request('/reports');
}

export function getAllReports() {
  return request('/reports?status=all');
}

export function getReportStats({ month, status = 'all', year }) {
  const params = new URLSearchParams({
    month: String(month),
    status,
    year: String(year),
  });

  return request(`/reports/stats?${params.toString()}`);
}

export function createReport(report) {
  return request('/reports', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(report),
  });
}

export function upvoteReport(reportId) {
  return request(`/reports/${reportId}/upvote`, {
    method: 'POST',
    auth: true,
  });
}

export function downvoteReport(reportId) {
  return request(`/reports/${reportId}/downvote`, {
    method: 'POST',
    auth: true,
  });
}

function getAssetMimeType(asset) {
  if (asset?.mimeType) {
    return asset.mimeType;
  }

  const fileName = asset?.fileName || asset?.uri || '';
  const extension = fileName.split('?')[0].split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function getAssetFileName(asset, mimeType) {
  if (asset?.fileName) {
    return asset.fileName;
  }

  const extensionByMimeType = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = extensionByMimeType[mimeType] || 'jpg';

  return `report-photo.${extension}`;
}

export async function uploadReportPhoto(asset) {
  if (!asset?.uri) {
    throw new Error('Imagem invalida.');
  }

  const mimeType = getAssetMimeType(asset);
  const formData = new FormData();

  formData.append('photo', {
    uri: asset.uri,
    name: getAssetFileName(asset, mimeType),
    type: mimeType,
  });

  const response = await fetch(`${API_URL}/reports/photo`, {
    method: 'POST',
    body: formData,
    headers: await getAuthHeaders(),
  });

  const data = await parseResponseJson(response);

  if (response.status === 401) {
    await handleUnauthorized();
    throw new ApiAuthError(data.error);
  }

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao enviar foto');
  }

  return data.photoUrl;
}
