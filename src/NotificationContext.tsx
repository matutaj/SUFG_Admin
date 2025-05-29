import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getUserData, UserData } from '../src/api/authUtils';
import { getAllProducts, getAllLocations, getAllProductLocations } from '../src/api/methods';

interface Notification {
  id: string;
  message: string;
  type: 'stock' | 'cashier' | 'info' | 'low_stock' | 'expiration';
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
  checkLowStock: (products: any[], locations: any[], productLocations: any[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [notifiedLowStock, setNotifiedLowStock] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productLocations, setProductLocations] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
        console.log('[NotificationContext] Dados do usuário carregados:', userData);

        const [productsData, locationsData, productLocationsData] = await Promise.all([
          getAllProducts(),
          getAllLocations(),
          getAllProductLocations(),
        ]);

        setProducts(productsData ?? []);
        setLocations(locationsData ?? []);
        setProductLocations(productLocationsData ?? []);

        const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
            read: n.read ?? false,
          }));
          setNotifications(parsed.slice(0, MAX_NOTIFICATIONS));
        }

        if (productsData?.length && locationsData?.length && productLocationsData?.length) {
          console.log('[NotificationContext] Executando verificação inicial de estoque baixo...');
          checkLowStock(productsData, locationsData, productLocationsData);
        }
      } catch (error) {
        console.error('[NotificationContext] Erro ao carregar dados:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(
        notifications.map((n) => ({
          ...n,
          timestamp: n.timestamp.toISOString(),
        })),
      ),
    );
  }, [notifications, isLoaded]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [...prev, newNotification].slice(-MAX_NOTIFICATIONS));
    console.log('[NotificationContext] Notificação adicionada:', newNotification);
  }, []);

  // Atualize a função checkLowStock para garantir que está sendo chamada corretamente:
  const checkLowStock = useCallback(
    (products: any[], locations: any[], productLocations: any[]) => {
      try {
        console.log('[NotificationContext] Verificando estoque baixo...');

        if (!user?.id_funcao) {
          console.log('[NotificationContext] Usuário não autenticado - ignorando verificação');
          return;
        }

        // Verificar se o usuário tem permissão para receber notificações
        const allowedRoles = ['1', '2', '3', '4']; // IDs das funções permitidas
        if (!allowedRoles.includes(user.id_funcao)) {
          console.log(
            '[NotificationContext] Usuário não tem permissão para notificações - ignorando',
          );
          return;
        }

        const newNotifiedLowStock = new Set<string>();

        productLocations.forEach((loc) => {
          const currentQty = Number(loc.quantidadeProduto) || 0;
          const minQty = Number(loc.quantidadeMinimaProduto) || 0;
          const notificationKey = `${loc.id_produto}-${loc.id_localizacao}-low-stock`;

          if (currentQty <= minQty) {
            const product = products.find((p) => p.id === loc.id_produto);
            const location = locations.find((l) => l.id === loc.id_localizacao);

            if (product && location) {
              if (!notifiedLowStock.has(notificationKey)) {
                const locationType = location.tipo === 'Loja' ? 'Loja' : 'Armazém';
                const message = `Estoque baixo: ${product.nomeProduto} (${locationType}) - Quantidade: ${currentQty} (Mínimo: ${minQty})`;

                addNotification({
                  message,
                  type: 'low_stock',
                  productId: product.id,
                  locationId: location.id,
                });

                newNotifiedLowStock.add(notificationKey);
              }
            }
          }
        });

        setNotifiedLowStock(newNotifiedLowStock);
      } catch (error) {
        console.error('[NotificationContext] Erro ao verificar estoque baixo:', error);
      }
    },
    [addNotification, notifiedLowStock, user?.id_funcao],
  ); 

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    console.log('[NotificationContext] Notificação removida:', id);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    console.log('[NotificationContext] Notificação marcada como lida:', id);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    console.log('[NotificationContext] Todas as notificações limpas');
  }, []);

  const filteredNotifications = useMemo(() => {
    if (!user || !user.id_funcao) return notifications;

    return notifications.filter((notification) => {
      if (notification.type === 'cashier') {
        return ['3', '4'].includes(user.id_funcao!);
      }
      if (notification.type === 'low_stock' || notification.type === 'expiration') {
        return ['1', '2', '3', '4'].includes(user.id_funcao!);
      }
      return true;
    });
  }, [notifications, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearNotifications,
        checkLowStock,
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
