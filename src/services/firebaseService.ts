import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { auth, db, storage, createAuthUserIsolated } from '../lib/firebase';

export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string; }
export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token: string; user: { id: string; username: string; email: string; firstName?: string; lastName?: string; role?: string; }; }
export interface User { id: string; username: string; email: string; firstName?: string; lastName?: string; role: string; isActive: boolean; createdAt: string; lastLoginAt?: string; }
export interface CreateUserRequest { username: string; email: string; firstName?: string; lastName?: string; role: string; password: string; }
export interface UpdateUserRequest { firstName?: string; lastName?: string; role?: string; isActive?: boolean; }
export interface TimelineEvent { id: string; name: string; date: string; category: string; location?: string; time?: string; attendees?: string; performers?: string; duration?: string; description?: string; photo_url?: string; created_at: string; updated_at: string; }
export interface CreateEventRequest { name: string; date: string; category: string; location?: string; time?: string; attendees?: string; performers?: string; duration?: string; description?: string; photo_url?: string; }
export interface ActivityLog { id: string; user_id: string; userId?: string; action: string; details: string; ip_address?: string; ipAddress?: string; timestamp: string; username?: string; first_name?: string; last_name?: string; }

type FirebaseUserData = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

export const OWNER_EMAIL = 'iscurt.w@gmail.com';

export class FirebaseService {
  private stringValue(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
  }

  private optionalStringValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private booleanValue(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private friendlyAuthError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return 'Login failed. Please check your credentials.';
    }
  }

  private async ensureFirestoreUser(firebaseUser: FirebaseUser): Promise<FirebaseUserData | undefined> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const isOwner = firebaseUser.email === OWNER_EMAIL;
      const isKnownAdmin = ['on3keymusic@gmail.com', 'vanstringscm@gmail.com'].includes(firebaseUser.email || '');
      await setDoc(userRef, {
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || firebaseUser.uid,
        email: firebaseUser.email || '',
        role: isOwner ? 'super_admin' : isKnownAdmin ? 'admin' : 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      });
      userDoc = await getDoc(userRef);
    } else if (firebaseUser.email === OWNER_EMAIL && userDoc.data()?.role !== 'super_admin') {
      await updateDoc(userRef, { role: 'super_admin' });
      userDoc = await getDoc(userRef);
    }

    return userDoc.data() as FirebaseUserData | undefined;
  }


  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      let email = credentials.username.trim();

      // If not an email, look up by username in Firestore
      if (!email.includes('@')) {
        try {
          const q = query(collection(db, 'users'), where('username', '==', email));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            email = snapshot.docs[0].data().email;
          } else {
            return { success: false, error: 'User not found. Please sign in with your email address.' };
          }
        } catch {
          return { success: false, error: 'Please sign in with your email address.' };
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      const firebaseUser = userCredential.user;
      const userData = await this.ensureFirestoreUser(firebaseUser);

      return {
        success: true,
        data: {
          token: await firebaseUser.getIdToken(),
          user: {
            id: firebaseUser.uid,
            username: this.stringValue(userData?.username, firebaseUser.email?.split('@')[0] || ''),
            email: firebaseUser.email || '',
            firstName: this.optionalStringValue(userData?.firstName),
            lastName: this.optionalStringValue(userData?.lastName),
            role: this.stringValue(userData?.role, 'user')
          }
        }
      };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? '';
      return { success: false, error: this.friendlyAuthError(code) };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: false, error: 'Not authenticated' };

      const userData = await this.ensureFirestoreUser(currentUser);

      return {
        success: true,
        data: {
          user: {
            id: currentUser.uid,
            username: this.stringValue(userData?.username, currentUser.email?.split('@')[0] || ''),
            email: currentUser.email || '',
            firstName: this.optionalStringValue(userData?.firstName),
            lastName: this.optionalStringValue(userData?.lastName),
            role: this.stringValue(userData?.role, 'user'),
            isActive: this.booleanValue(userData?.isActive, true),
            createdAt: this.stringValue(userData?.createdAt, new Date().toISOString())
          }
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  clearToken() {
    // Sign out from Firebase
    signOut(auth).catch(() => {});
  }

  // User Management
  async getUsers(): Promise<ApiResponse<{ users: User[] }>> {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          isActive: data.isActive,
          createdAt: data.createdAt
        });
      });

      return { success: true, data: { users } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<{ userId: string; message: string }>> {
    try {
      // Use an isolated secondary Firebase app so creating the user doesn't sign out the admin
      const uid = await createAuthUserIsolated(userData.email, userData.password);

      await setDoc(doc(db, 'users', uid), {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      return { success: true, data: { userId: uid, message: 'User created' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const targetDoc = await getDoc(doc(db, 'users', userId));
      if (targetDoc.exists()) {
        const targetEmail = targetDoc.data()?.email;
        if (targetEmail === OWNER_EMAIL && (userData.role !== undefined || userData.isActive !== undefined)) {
          return { success: false, error: 'The owner account cannot be modified.' };
        }
        if (userData.role === 'super_admin' && targetEmail !== OWNER_EMAIL) {
          return { success: false, error: 'Only the owner account can hold the super_admin role.' };
        }
      }
      await updateDoc(doc(db, 'users', userId), {
        ...userData
      });
      return { success: true, data: { message: 'User updated' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const targetDoc = await getDoc(doc(db, 'users', userId));
      if (targetDoc.exists() && targetDoc.data()?.email === OWNER_EMAIL) {
        return { success: false, error: 'The owner account cannot be deleted.' };
      }
      await deleteDoc(doc(db, 'users', userId));
      // Note: This doesn't delete the Auth user without Cloud Functions
      return { success: true, data: { message: 'User deleted' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // Activity Logs
  async getAllActivityLogs(page: number = 1, limit: number = 100, action: string = 'all'): Promise<ApiResponse<{ 
    logs: ActivityLog[], 
    pagination: { page: number, limit: number, total: number, totalPages: number } 
  }>> {
    try {
      let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
      
      if (action !== 'all') {
        q = query(q, where('action', '==', action));
      }

      const querySnapshot = await getDocs(q);
      const allLogs: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        allLogs.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });

      const total = allLogs.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const logs = allLogs.slice(start, start + limit);

      return {
        success: true,
        data: {
          logs,
          pagination: { page, limit, total, totalPages }
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // Write an activity log entry (snake_case fields to match getAllActivityLogs' read shape).
  // Swallows its own errors so logging can never break the action it records.
  async createLog(entry: { userId: string; action: string; details: string; username?: string }): Promise<void> {
    try {
      await addDoc(collection(db, 'logs'), {
        user_id: entry.userId,
        action: entry.action,
        details: entry.details,
        username: entry.username ?? '',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // intentionally ignored — activity logging is best-effort
    }
  }

  // Timeline Events
  async getEvents(): Promise<ApiResponse<{ events: TimelineEvent[] }>> {
    try {
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const events: TimelineEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as TimelineEvent);
      });

      return { success: true, data: { events } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async createEvent(eventData: CreateEventRequest): Promise<ApiResponse<{ id: string; message: string }>> {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...this.stripUndefined(eventData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return { success: true, data: { id: docRef.id, message: 'Event created' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async updateEvent(eventId: string, eventData: CreateEventRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        ...this.stripUndefined(eventData),
        updated_at: new Date().toISOString()
      });
      return { success: true, data: { message: 'Event updated' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      return { success: true, data: { message: 'Event deleted' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // File Upload
  async uploadImage(file: File): Promise<ApiResponse<{ filePath: string; filename: string; originalName: string; size: number }>> {
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        data: {
          filePath: downloadURL,
          filename: snapshot.ref.name,
          originalName: file.name,
          size: snapshot.metadata.size
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // Team Members
  async getTeamMembers(): Promise<ApiResponse<{ members: Record<string, unknown>[] }>> {
    try {
      const q = query(collection(db, 'teamMembers'));
      const snap = await getDocs(q);
      const members: Record<string, unknown>[] = [];
      snap.forEach(d => members.push({ id: d.id, ...d.data() }));
      return { success: true, data: { members } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  private stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  async createTeamMember(data: Record<string, unknown>): Promise<ApiResponse<{ id: string }>> {
    try {
      const docRef = await addDoc(collection(db, 'teamMembers'), {
        ...this.stripUndefined(data),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, data: { id: docRef.id } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async updateTeamMember(id: string, data: Record<string, unknown>): Promise<ApiResponse<{ message: string }>> {
    try {
      await updateDoc(doc(db, 'teamMembers', id), { ...this.stripUndefined(data), updatedAt: new Date().toISOString() });
      return { success: true, data: { message: 'Updated' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  async deleteTeamMember(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      await deleteDoc(doc(db, 'teamMembers', id));
      return { success: true, data: { message: 'Deleted' } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return {
      success: true,
      data: { status: 'ok', timestamp: new Date().toISOString() }
    };
  }

  // ─── Vanstring sections (orchestra roster) ─────────────────────────────
  async getVanstringSections(): Promise<ApiResponse<{ groups: VanstringSection[] }>> {
    try {
      const snap = await getDoc(doc(db, 'vanstring', 'sections'));
      if (!snap.exists()) {
        return { success: true, data: { groups: [] } };
      }
      const raw = snap.data();
      const groups = Array.isArray(raw.groups) ? raw.groups as VanstringSection[] : [];
      return { success: true, data: { groups } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load Vanstring sections' };
    }
  }

  async updateVanstringSections(groups: VanstringSection[]): Promise<ApiResponse<null>> {
    try {
      await setDoc(doc(db, 'vanstring', 'sections'), {
        groups,
        updatedAt: new Date().toISOString(),
      });
      return { success: true, data: null };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save Vanstring sections' };
    }
  }

  // ─── Photo Manager (Firebase Storage + Firestore index) ─────────────────
  async listPhotos(): Promise<ApiResponse<{ photos: PhotoRecord[] }>> {
    try {
      const snap = await getDocs(query(collection(db, 'photos'), orderBy('uploadedAt', 'desc')));
      const photos: PhotoRecord[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          url:         this.stringValue(data.url),
          storagePath: this.stringValue(data.storagePath),
          category:    this.stringValue(data.category, 'onekey') as PhotoCategory,
          filename:    this.stringValue(data.filename),
          uploadedAt:  this.stringValue(data.uploadedAt),
        };
      });
      return { success: true, data: { photos } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load photos' };
    }
  }

  async uploadPhoto(file: File, category: PhotoCategory): Promise<ApiResponse<PhotoRecord>> {
    try {
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Only image files are allowed' };
      }
      if (file.size > 12 * 1024 * 1024) {
        return { success: false, error: 'File is over 12 MB' };
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `photos/${category}/${Date.now()}_${safeName}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);

      const docRef = await addDoc(collection(db, 'photos'), {
        url,
        storagePath,
        category,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
      });

      return {
        success: true,
        data: { id: docRef.id, url, storagePath, category, filename: file.name, uploadedAt: new Date().toISOString() },
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async deletePhoto(photo: PhotoRecord): Promise<ApiResponse<null>> {
    try {
      if (photo.storagePath) {
        try { await deleteObject(ref(storage, photo.storagePath)); }
        catch { /* file may already be gone — proceed with Firestore cleanup */ }
      }
      await deleteDoc(doc(db, 'photos', photo.id));
      return { success: true, data: null };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async updatePhotoCategory(id: string, category: PhotoCategory): Promise<ApiResponse<null>> {
    try {
      await updateDoc(doc(db, 'photos', id), { category });
      return { success: true, data: null };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
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
