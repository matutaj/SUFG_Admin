import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getUserData, UserData } from '../src/api/authUtils';
// Definição de tipos
interface Notification {
  id: string;
  message: string;
  type: 'stock' | 'cashier' | 'info' | 'low_stock';
  read?: boolean;
  timestamp: Date;
  productId?: string;
  locationId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  filteredNotifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  isLoadingUser: boolean; // Adicionado para expor o estado de carregamento
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100; // Limite para evitar crescimento excessivo no localStorage

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Carregar usuário
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  // Carregar notificações do localStorage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as any[];
          const loadedNotifications = parsed.map((n) => ({
            ...n,
            timestamp: new Date(n.timestamp),
            read: n.read ?? false,
          }));
          setNotifications(loadedNotifications.slice(0, MAX_NOTIFICATIONS));
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      } finally {
        setIsLoaded(true);
      }
    };

    loadNotifications();
  }, []);

  // Salvar notificações no localStorage
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const notificationsToSave = notifications.map((n) => ({
        ...n,
        timestamp: n.timestamp.toISOString(),
      }));
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications, isLoaded]);

  // Sincronizar entre abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === NOTIFICATION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as any[];
          setNotifications(
            parsed.map((n) => ({
              ...n,
              timestamp: new Date(n.timestamp),
              read: n.read ?? false,
            })),
          );
        } catch (error) {
          console.error('Failed to sync notifications:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filtragem de notificações baseada no usuário
  const filteredNotifications = useMemo(() => {
    if (!user || !user.id_funcao) return notifications; // Retorna todas se não há usuário ou id_funcao

    return notifications.filter((notification) => {
      if (notification.type === 'cashier') {
        return ['3', '4'].includes(user.id_funcao!); // Estoquista e Repositor
      }
      if (notification.type === 'low_stock') {
        return ['1', '2', '3', '4'].includes(user.id_funcao!); // Admin, Gerente, Estoquista, Repositor
      }
      return true; // Outras notificações são visíveis para todos
    });
  }, [notifications, user]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [...prev, newNotification].slice(-MAX_NOTIFICATIONS));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearNotifications,
        isLoadingUser,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
