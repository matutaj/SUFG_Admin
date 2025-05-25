import React, { createContext, useContext, useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  type: string;
  read?: boolean;
  timestamp?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Carregar notificações do localStorage ao montar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    console.log(
      '[NotificationContext] Carregando notificações do localStorage:',
      savedNotifications,
    );
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        if (Array.isArray(parsedNotifications)) {
          setNotifications(parsedNotifications);
          console.log(
            '[NotificationContext] Notificações carregadas com sucesso:',
            parsedNotifications,
          );
        } else {
          console.warn(
            '[NotificationContext] Dados inválidos no localStorage, mantendo estado vazio',
          );
          setNotifications([]);
        }
      } catch (error) {
        console.error('[NotificationContext] Erro ao parsear notificações:', error);
        setNotifications([]);
      }
    } else {
      console.log('[NotificationContext] Nenhuma notificação encontrada no localStorage');
    }
  }, []);

  // Salvar notificações no localStorage sempre que mudarem
  useEffect(() => {
    console.log('[NotificationContext] Salvando notificações no localStorage:', notifications);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Monitorar alterações no localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'notifications') {
        console.log('[NotificationContext] Chave notifications alterada:', {
          oldValue: e.oldValue,
          newValue: e.newValue,
        });
      } else if (e.key === null) {
        console.warn('[NotificationContext] localStorage limpo completamente');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [...prev, newNotification];
      console.log('[NotificationContext] Nova notificação adicionada:', newNotification);
      return updated;
    });
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      console.log('[NotificationContext] Notificação removida:', id);
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      console.log('[NotificationContext] Notificação marcada como lida:', id);
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    console.log('[NotificationContext] Todas as notificações limpas');
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearNotifications,
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
