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
    notifications.forEach((notif) => {
      if (!notif.read) {
        markAsRead(notif.id);
      }
    });
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
          <Box sx={{ p: 2, minWidth: 300, maxHeight: 400, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Notificações ({filteredNotifications.length})
            </Typography>
            {filteredNotifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma notificação
              </Typography>
            ) : (
              <List>
                {filteredNotifications.map((notification) => (
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
                      bgcolor: notification.read ? 'background.paper' : 'action.hover',
                      borderLeft: notification.read ? 'none' : '4px solid',
                      borderLeftColor: 'primary.main',
                    }}
                  >
                    <ListItemText
                      primary={notification.message}
                      secondary={notification.timestamp?.toLocaleString()}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: notification.read ? 'normal' : 'bold',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {filteredNotifications.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    filteredNotifications.forEach((notif) => {
                      if (!notif.read) {
                        markAsRead(notif.id);
                      }
                    });
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
                  sx={{ ml: 1 }}
                >
                  Limpar todas
                </Button>
              </Box>
            )}
          </Box>
        </Popover>
      </AppBar>
    </ElevationScroll>
  );
};

export default TopBar;
