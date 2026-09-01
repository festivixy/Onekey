import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService, CreateEventRequest } from '../services/firebaseService';

export interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  category: 'performances' | 'homework' | 'charity' | 'recognition';
  location?: string;
  time?: string;
  /** Optional display override when the exact date is unknown (e.g. "2020") */
  dateLabel?: string;
  attendees?: string;
  performers?: string;
  duration?: string;
  description?: string;
  photo?: string | null;
  photos?: string[];
  createdAt: string;
  createdBy: string;
}

interface TimelineState {
  events: TimelineEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<TimelineEvent | null>;
  removeEvent: (eventId: string) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>) => Promise<boolean>;
  getEventsByCategory: (category: TimelineEvent['category']) => TimelineEvent[];
  getEventById: (eventId: string) => TimelineEvent | undefined;
  clearError: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      events: [],
      isLoading: false,
      error: null,

      fetchEvents: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.getEvents();
          
          if (response.success && response.data) {
            const events: TimelineEvent[] = response.data.events.map(apiEvent => ({
              id: apiEvent.id,
              name: apiEvent.name,
              date: apiEvent.date,
              category: apiEvent.category as TimelineEvent['category'],
              location: apiEvent.location,
              time: apiEvent.time,
              attendees: apiEvent.attendees,
              performers: apiEvent.performers,
              duration: apiEvent.duration,
              description: apiEvent.description,
              photo: apiEvent.photo_url,
              createdAt: apiEvent.created_at,
              createdBy: 'system', // Backend doesn't provide this yet
            }));
            
            set({ events, isLoading: false, error: null });
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to fetch events'
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch events'
          });
        }
      },

      addEvent: async (eventData) => {
        set({ isLoading: true, error: null });
        
        try {
          const apiEventData: CreateEventRequest = {
            name: eventData.name,
            date: eventData.date,
            category: eventData.category,
            location: eventData.location,
            time: eventData.time,
            attendees: eventData.attendees,
            performers: eventData.performers,
            duration: eventData.duration,
            description: eventData.description,
            photo_url: eventData.photo || undefined,
          };
          
          const response = await apiService.createEvent(apiEventData);
          
          if (response.success) {
            // Refresh events list
            await get().fetchEvents();
            set({ isLoading: false, error: null });
            
            // Return the created event
            const newEvent: TimelineEvent = {
              ...eventData,
              id: response.data?.id || '',
              createdAt: new Date().toISOString(),
            };
            
            return newEvent;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to create event'
            });
            return null;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create event'
          });
          return null;
        }
      },

      removeEvent: async (eventId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.deleteEvent(eventId);
          
          if (response.success) {
            // Refresh events list
            await get().fetchEvents();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to delete event'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to delete event'
          });
          return false;
        }
      },

      updateEvent: async (eventId, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          const apiEventData: CreateEventRequest = {
            name: updates.name || '',
            date: updates.date || '',
            category: updates.category || 'performances',
            location: updates.location,
            time: updates.time,
            attendees: updates.attendees,
            performers: updates.performers,
            duration: updates.duration,
            description: updates.description,
            photo_url: updates.photo || undefined,
          };
          
          const response = await apiService.updateEvent(eventId, apiEventData);
          
          if (response.success) {
            // Refresh events list
            await get().fetchEvents();
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to update event'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to update event'
          });
          return false;
        }
      },

      getEventsByCategory: (category) => {
        const { events } = get();
        return events
          .filter(event => event.category === category)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getEventById: (eventId) => {
        const { events } = get();
        return events.find(event => event.id === eventId);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'onekey-timeline',
      partialize: (state) => ({
        events: state.events,
      }),
    }
  )
); 