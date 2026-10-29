import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';

export default function AccountSubpage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <PageLayout title={title}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1 }}>
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          <IconButton
            component={RouterLink}
            to="/cuenta"
            aria-label="Volver a Cuenta"
            sx={{ minWidth: 48, minHeight: 48, color: 'primary.main' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Paper>
        {children}
      </Box>
    </PageLayout>
  );
}
