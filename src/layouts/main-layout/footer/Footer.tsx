import { Box, Link, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Typography
      variant="h6"
      component="footer"
      sx={{ pt: 3.75, textAlign: { xs: 'center', md: 'right' } }}
    >
      Made with{' '}
      <Box component="span" sx={{ color: 'error.main', verticalAlign: 'middle' }}>
        &#10084;
      </Box>{' '}
      by{' '}
      <Link
        href="https://www.linkedin.com/in/matuta-jorge-4236b7204/"
        target="_blank"
        rel="noopener"
        aria-label="Explore ThemeWagon Website"
        sx={{ color: 'neutral.dark', '&:hover': { color: 'secondary.main' } }}
      >
        matutaj2080@gmail.com and Elsayed.bruno2004@gmail.com
      </Link>
    </Typography>
  );
};

export default Footer;
