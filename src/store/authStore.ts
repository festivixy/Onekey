import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService, CreateUserRequest } from '../services/firebaseService';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  department?: string;
  avatar?: string;
}

export interface UserCredentials {
  userId: string;
  passwordHash: string; // In production, this would be properly hashed
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  activityLogs: ActivityLog[];
  activityLogsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // User management
  fetchUsers: () => Promise<void>;
  addUser: (userData: CreateUserRequest) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  
  // Activity logging
  logActivity: (userId: string, action: string, details: string) => void;
  fetchAllActivityLogs: (page?: number, limit?: number, action?: string) => Promise<void>;
  
  // Current user
  getCurrentUser: () => Promise<void>;
  
  // Permissions
  getUserPermissions: (role: string) => string[];
  hasPermission: (permission: string) => boolean;
  
  // Error handling
  clearError: () => void;
}



// Permission definitions
const PERMISSIONS = {
  super_admin: [
    'basic_admin',
    'manage_users',
    'delete_users', 
    'change_user_roles',
    'view_activity_logs',
    'system_admin',
    'manage_timeline',
    'export_data',
    'view_all_content'
  ],
  admin: [
    'manage_timeline',
    'view_user_list',
    'moderate_content',
    'view_all_content',
    'basic_admin'
  ],
  user: [
    'view_public_content',
    'view_timeline',
    'edit_own_profile'
  ]
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [],
      activityLogs: [],
      activityLogsPagination: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login({ username, password });
          
          if (response.success && response.data) {
            const user: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              email: response.data.user.email,
              firstName: response.data.user.firstName,
              lastName: response.data.user.lastName,
              role: response.data.user.role as User['role'] || 'user',
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            
            set({
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null
            });
            
            return true;
          } else {
            set({
              isLoading: false, 
              error: response.error || 'Login failed' 
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
          });
          return false;
        }
      },

      logout: () => {
        apiService.clearToken();
        set({ user: null, isAuthenticated: false, error: null });
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.getCurrentUser();
          
          if (response.success && response.data) {
            const user: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              email: response.data.user.email,
              firstName: response.data.user.firstName,
              lastName: response.data.user.lastName,
              role: response.data.user.role as User['role'] || 'user',
              isActive: response.data.user.isActive,
              createdAt: response.data.user.createdAt,
              lastLoginAt: response.data.user.lastLoginAt,
            };
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: response.error || 'Failed to get user'
            });
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to get user'
          });
        }
      },

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.getUsers();
          
          if (response.success && response.data) {
            const users: User[] = response.data.users.map(apiUser => ({
              id: apiUser.id,
              username: apiUser.username,
              email: apiUser.email,
              firstName: apiUser.firstName,
              lastName: apiUser.lastName,
              role: apiUser.role as User['role'] || 'user',
              isActive: apiUser.isActive,
              createdAt: apiUser.createdAt,
              lastLoginAt: apiUser.lastLoginAt,
            }));
            
            set({ users, isLoading: false, error: null });
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to fetch users'
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch users'
          });
        }
      },

      addUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.createUser(userData);
          
          if (response.success) {
            // Refresh users list
            await get().fetchUsers();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to create user'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create user'
          });
          return false;
        }
      },

      removeUser: async (userId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.deleteUser(userId);
          
          if (response.success) {
            // Refresh users list
            await get().fetchUsers();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to delete user'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to delete user'
          });
          return false;
        }
      },

      updateUserRole: async (userId, role) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateUser(userId, { role });
          
          if (response.success) {
            // Refresh users list
            await get().fetchUsers();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to update user role'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to update user role'
          });
          return false;
        }
      },

      updateUserStatus: async (userId, isActive) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateUser(userId, { isActive });
          
          if (response.success) {
            // Refresh users list
            await get().fetchUsers();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to update user status'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to update user status'
          });
          return false;
        }
      },

      changePassword: async (userId, currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { auth } = await import('../lib/firebase');
          const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
          const firebaseUser = auth.currentUser;
          if (!firebaseUser || firebaseUser.uid !== userId || !firebaseUser.email) {
            set({ isLoading: false, error: 'You can only change your own password' });
            return false;
          }
          const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
          await reauthenticateWithCredential(firebaseUser, credential);
          await updatePassword(firebaseUser, newPassword);
          set({ isLoading: false });
          return true;
        } catch (error: unknown) {
          const code = (error as { code?: string })?.code;
          const msg = code === 'auth/wrong-password' || code === 'auth/invalid-credential'
            ? 'Current password is incorrect'
            : error instanceof Error ? error.message : 'Failed to change password';
          set({ isLoading: false, error: msg });
          return false;
        }
      },

      logActivity: (userId, action, details) => {
        const newLog: ActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          action,
          details,
          timestamp: new Date().toISOString(),
        };
        
        set(state => ({
          activityLogs: [newLog, ...state.activityLogs].slice(0, 1000) // Keep last 1000 logs
        }));

        // Persist to Firestore so the log survives reloads (createLog swallows its own errors)
        apiService.createLog({ userId, action, details, username: get().user?.username });
      },

      fetchAllActivityLogs: async (page = 1, limit = 100, action = 'all') => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getAllActivityLogs(page, limit, action);
          if (response.success && response.data) {
            // Transform API data to store format
            const transformedLogs = response.data.logs.map(log => ({
              id: log.id,
              userId: log.user_id,
              action: log.action,
              details: log.details,
              timestamp: log.timestamp,
              ipAddress: log.ip_address,
              username: log.username,
              firstName: log.first_name,
              lastName: log.last_name
            }));
            
            set({
              activityLogs: transformedLogs,
              activityLogsPagination: response.data.pagination,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch activity logs',
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch activity logs',
          });
        }
      },

      getUserPermissions: (role: string) => {
        return PERMISSIONS[role as keyof typeof PERMISSIONS] || [];
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        const userPermissions = PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'onekey-auth-v2',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 