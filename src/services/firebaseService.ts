export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string; }
export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token?: string; user: { id: string; username: string; email: string; firstName?: string; lastName?: string; role?: string; }; }
export interface User { id: string; username: string; email: string; firstName?: string; lastName?: string; role: string; isActive: boolean; createdAt: string; lastLoginAt?: string; }
export interface CreateUserRequest { username: string; email: string; firstName?: string; lastName?: string; role: string; password: string; }
export interface UpdateUserRequest { firstName?: string; lastName?: string; role?: string; isActive?: boolean; }
export interface TimelineEvent { id: string; name: string; date: string; category: string; location?: string; time?: string; attendees?: string; performers?: string; duration?: string; description?: string; photo_url?: string; created_at: string; updated_at: string; }
export interface CreateEventRequest { name: string; date: string; category: string; location?: string; time?: string; attendees?: string; performers?: string; duration?: string; description?: string; photo_url?: string; }
export interface ActivityLog { id: string; user_id: string; userId?: string; action: string; details: string; ip_address?: string; ipAddress?: string; timestamp: string; username?: string; first_name?: string; last_name?: string; }

export const OWNER_EMAIL = 'iscurt.w@gmail.com';

const API = '/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API}${path}`, { credentials: 'same-origin', ...init });
    // Every endpoint returns the { success, data?, error? } envelope as JSON:
    return (await res.json()) as ApiResponse<T>;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

export class FirebaseService {
  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiFetch<LoginResponse>('/login', jsonInit('POST', credentials));
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return apiFetch<{ user: User }>('/me');
  }

  clearToken() {
    void apiFetch('/logout', { method: 'POST' });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/change-password', jsonInit('POST', { currentPassword, newPassword }));
  }

  // User Management
  async getUsers(): Promise<ApiResponse<{ users: User[] }>> {
    return apiFetch<{ users: User[] }>('/users');
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<{ userId: string; message: string }>> {
    return apiFetch<{ userId: string; message: string }>('/users', jsonInit('POST', userData));
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/users/${userId}`, jsonInit('PATCH', userData));
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/users/${userId}`, { method: 'DELETE' });
  }

  // Activity Logs
  async getAllActivityLogs(page: number = 1, limit: number = 100, action: string = 'all'): Promise<ApiResponse<{
    logs: ActivityLog[],
    pagination: { page: number, limit: number, total: number, totalPages: number }
  }>> {
    return apiFetch(`/logs?page=${page}&limit=${limit}&action=${encodeURIComponent(action)}`);
  }

  // Server logs writes automatically; nothing to send from the client.
  async createLog(_entry?: { userId: string; action: string; details: string; username?: string }): Promise<void> {}

  // Timeline Events
  async getEvents(): Promise<ApiResponse<{ events: TimelineEvent[] }>> {
    return apiFetch<{ events: TimelineEvent[] }>('/events');
  }

  async createEvent(eventData: CreateEventRequest): Promise<ApiResponse<{ id: string; message: string }>> {
    return apiFetch<{ id: string; message: string }>('/events', jsonInit('POST', eventData));
  }

  async updateEvent(eventId: string, eventData: CreateEventRequest): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/events/${eventId}`, jsonInit('PATCH', eventData));
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/events/${eventId}`, { method: 'DELETE' });
  }

  // File Upload
  async uploadImage(file: File): Promise<ApiResponse<{ filePath: string; filename: string; originalName: string; size: number }>> {
    const fd = new FormData();
    fd.append('file', file);
    return apiFetch<{ filePath: string; filename: string; originalName: string; size: number }>('/uploads', { method: 'POST', body: fd });
  }

  // Team Members
  async getTeamMembers(): Promise<ApiResponse<{ members: Record<string, unknown>[] }>> {
    return apiFetch<{ members: Record<string, unknown>[] }>('/team');
  }

  async createTeamMember(data: Record<string, unknown>): Promise<ApiResponse<{ id: string }>> {
    return apiFetch<{ id: string }>('/team', jsonInit('POST', data));
  }

  async updateTeamMember(id: string, data: Record<string, unknown>): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/team/${id}`, jsonInit('PATCH', data));
  }

  async deleteTeamMember(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>(`/team/${id}`, { method: 'DELETE' });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiFetch<{ status: string; timestamp: string }>('/health');
  }

  // ─── Vanstring sections (orchestra roster) ─────────────────────────────
  async getVanstringSections(): Promise<ApiResponse<{ groups: VanstringSection[] }>> {
    return apiFetch<{ groups: VanstringSection[] }>('/vanstring');
  }

  async updateVanstringSections(groups: VanstringSection[]): Promise<ApiResponse<null>> {
    return apiFetch<null>('/vanstring', jsonInit('PUT', { groups }));
  }

  // ─── Photo Manager ────────────────────────────────────────────────────
  async listPhotos(): Promise<ApiResponse<{ photos: PhotoRecord[] }>> {
    return apiFetch<{ photos: PhotoRecord[] }>('/photos');
  }

  async uploadPhoto(file: File, category: PhotoCategory): Promise<ApiResponse<PhotoRecord>> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    return apiFetch<PhotoRecord>('/photos', { method: 'POST', body: fd });
  }

  async deletePhoto(photo: PhotoRecord): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/photos/${photo.id}`, { method: 'DELETE' });
  }

  async updatePhotoCategory(id: string, category: PhotoCategory): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/photos/${id}`, jsonInit('PATCH', { category }));
  }
}

export interface VanstringSection {
  section: string;
  members: string[];
}

export type PhotoCategory = 'onekey' | 'vanstring' | 'richmond-hospital' | 'vancouver-aquarium' | 'vtc';

export const PHOTO_CATEGORIES: { id: PhotoCategory; label: string; color: string }[] = [
  { id: 'onekey',             label: 'OneKey',                       color: '#c8a46e' },
  { id: 'vanstring',          label: 'Vanstring',                    color: '#a5b4fc' },
  { id: 'richmond-hospital',  label: 'Richmond Hospital',            color: '#fb7185' },
  { id: 'vancouver-aquarium', label: 'Vancouver Aquarium',           color: '#6baed6' },
  { id: 'vtc',                label: 'Voluntary Teaching for China', color: '#86bc88' },
];

export interface PhotoRecord {
  id: string;
  url: string;
  storagePath: string;
  category: PhotoCategory;
  filename: string;
  uploadedAt: string;
}

export const apiService = new FirebaseService();
