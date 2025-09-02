import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm?: () => void;
  showCancelButton?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  title,
  message,
  severity,
  confirmText = 'OK',
  onConfirm,
  showCancelButton = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getColor = () => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: 24,
          p: 2,
          minWidth: 400,
        },
      }}
      TransitionProps={{
        timeout: 300,
        easing: { enter: 'ease-out', exit: 'ease-in' },
      }}
    >
      <DialogTitle
        id="alert-dialog-title"
        sx={{
          color: `${getColor()}.main`,
          fontWeight: 'bold',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconifyIcon
          icon={
            severity === 'success'
              ? 'mdi:check-circle'
              : severity === 'error'
                ? 'mdi:alert-circle'
                : severity === 'warning'
                  ? 'mdi:alert'
                  : 'mdi:information'
          }
        />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" sx={{ color: 'text.primary', mt: 1 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {showCancelButton && (
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancelar
          </Button>
        )}
        <Button onClick={handleConfirm} color={getColor()} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertModal;
