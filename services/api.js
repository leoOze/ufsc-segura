import Constants from 'expo-constants';
import { getToken } from './authStorage';

function getApiUrl() {
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

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.auth) {
    const token = await getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

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

export function register(loginValue, password) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue, password }),
  });
}

export function getReports() {
  return request('/reports');
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
