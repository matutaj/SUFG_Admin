import {
  AppBar,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import AccountMenu from './AccountMenu';
import OutlinedBadge from 'components/styled/OutlinedBadge';
import { rootPaths } from 'routes/paths';
import Logo from 'components/icons/common/Logo';
import ElevationScroll from './ElevationScroll';
import Notification from 'components/icons/appbar/Notification';
import { useNotifications } from '../../../NotificationContext';
import { useState, useEffect } from 'react';
import { getUserData } from '../../../api/authUtils';
import type { UserData } from '../../../api/authUtils';

interface TopBarProps {
  drawerWidth: number;
  onHandleDrawerToggle: () => void;
}

const TopBar = ({ drawerWidth, onHandleDrawerToggle }: TopBarProps) => {
  const { notifications, removeNotification, markAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<UserData | null>(null);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Removido o loop que marca as notificações como lidas
  };

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserData();
      setUser(userData);
      console.log('[TopBar] Dados do usuário carregados:', userData);
    };
    fetchUser();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    if (notification.type === 'cashier') {
      return user && ['Estoquista', 'Repositor'].includes(user.role || '');
    }
    return true;
  });

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleClearNotification = (id: string) => {
    removeNotification(id);
  };

  return (
    <ElevationScroll>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth + 1}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'end' }}>
          <Stack
            direction="row"
            alignItems="center"
            columnGap={{ xs: 1, sm: 2 }}
            sx={{ display: { md: 'none' } }}
          >
            <Link href={rootPaths.root}>
              <IconButton color="inherit" aria-label="logo">
                <Logo sx={{ fontSize: 27 }} />
              </IconButton>
            </Link>

            <IconButton color="inherit" aria-label="open drawer" onClick={onHandleDrawerToggle}>
              <IconifyIcon icon="mdi:hamburger-menu" />
            </IconButton>
          </Stack>

          <Stack direction="row" alignItems="center" columnGap={{ xs: 1, sm: 2, md: 3 }}>
            <IconButton
              aria-label="notifications"
              color="inherit"
              onClick={handleOpenNotifications}
            >
              <OutlinedBadge
                badgeContent={
                  filteredNotifications.filter((n) => !n.read).length > 0
                    ? filteredNotifications.filter((n) => !n.read).length
                    : ' '
                }
                color="error"
                variant={
                  filteredNotifications.filter((n) => !n.read).length > 0 ? 'standard' : 'dot'
                }
                overlap="circular"
              >
                <Notification />
              </OutlinedBadge>
            </IconButton>
            <AccountMenu />
          </Stack>
        </Toolbar>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseNotifications}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ minWidth: 300, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
            {/* Área fixa com título e botões */}
            <Box
              sx={{
                p: 2,
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: 'background.default', // Fundo para a área fixa
                borderBottom: '1px solid',
                borderColor: 'grey.300', // Borda inferior para separar da lista
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notificações ({filteredNotifications.length})
              </Typography>

              {/* Botões destacados com fundo, sombra e bordas */}
              {filteredNotifications.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 2,
                    p: 1, // Padding interno para os botões
                    bgcolor: 'background.paper', // Fundo claro
                    borderRadius: 1, // Bordas arredondadas
                    boxShadow: 2, // Sombra suave para elevação
                    border: '1px solid', // Borda sutil
                    borderColor: 'grey.300', // Cor da borda
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => {
                      filteredNotifications.forEach((notif) => {
                        if (!notif.read) {
                          markAsRead(notif.id);
                        }
                      });
                    }}
                    sx={{
                      bgcolor: 'primary.light', // Fundo do botão
                      color: 'primary.contrastText', // Cor do texto contrastante
                      '&:hover': {
                        bgcolor: 'primary.main', // Cor mais escura ao passar o mouse
                      },
                    }}
                  >
                    Marcar todas como lidas
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      filteredNotifications.forEach((notif) => {
                        removeNotification(notif.id);
                      });
                    }}
                    sx={{
                      ml: 1,
                      bgcolor: 'error.light', // Fundo do botão
                      color: 'error.contrastText', // Cor do texto contrastante
                      '&:hover': {
                        bgcolor: 'error.main', // Cor mais escura ao passar o mouse
                      },
                    }}
                  >
                    Limpar todas
                  </Button>
                </Box>
              )}
            </Box>

            {/* Área rolável com a lista de notificações */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
              {filteredNotifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação
                </Typography>
              ) : (
                <List>
                  {[...filteredNotifications]
                    .sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    )
                    .map((notification) => (
                      <ListItem
                        key={notification.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleClearNotification(notification.id)}
                          >
                            <IconifyIcon icon="mdi:close" />
                          </IconButton>
                        }
                        sx={{
                          bgcolor: notification.read ? 'background.paper' : 'grey.200', // Fundo cinza claro para não lidas
                          borderLeft: notification.read ? 'none' : '4px solid', // Borda para reforçar
                          borderLeftColor: 'grey.600', // Borda cinza escura para não lidas
                          transition: 'all 0.2s ease-in-out', // Transição suave
                          '&:hover': {
                            bgcolor: notification.read ? 'action.hover' : 'grey.300', // Hover cinza um pouco mais escuro para não lidas
                          },
                        }}
                      >
                        <ListItemText
                          primary={notification.message}
                          secondary={notification.timestamp?.toLocaleString()}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: notification.read ? 'normal' : 'bold', // Negrito para não lidas
                            color: notification.read ? '#B0BEC5' : '#424242', // Cinza claro para lidas, cinza escuro para não lidas
                          }}
                          secondaryTypographyProps={{
                            color: 'text.secondary', // Timestamp com cor padrão
                          }}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </Box>
          </Box>
        </Popover>
      </AppBar>
    </ElevationScroll>
  );
};

export default TopBar;
