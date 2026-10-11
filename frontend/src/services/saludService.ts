import { apiClient } from './apiClient';

export async function apiDisponible(): Promise<boolean> {
  try {
    const { data } = await apiClient.get<{ status: string }>('/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}
