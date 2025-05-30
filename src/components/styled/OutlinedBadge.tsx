import { Badge, BadgeProps, styled } from '@mui/material';

const OutlinedBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    left: 9,
    top: 7,
    width: 10,
    height: 16,
    border: `${theme.shape.borderRadius - 2.5}px solid ${theme.palette.background.default}`,
  },
}));

export default OutlinedBadge;
