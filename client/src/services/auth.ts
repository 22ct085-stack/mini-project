import axios from 'axios';

export type AuthUser = { id: string; name: string; email: string };
type AuthResponse = { success: boolean; user: AuthUser };
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 12000, withCredentials: true });

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data.user;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthResponse>('/auth/me');
  return data.user;
}

export async function signOut() {
  await api.post('/auth/logout');
}
