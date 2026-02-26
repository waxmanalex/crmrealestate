import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, useScrollTrigger } from '@mui/material';
import { MenuRounded, DarkModeRounded, LightModeRounded } from '@mui/icons-material';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { useThemeMode } from '../../context/ThemeContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggleMode } = useThemeMode();
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { md: `${DRAWER_WIDTH}px` },
          minHeight: '100vh',
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={trigger ? 1 : 0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton
              sx={{ display: { md: 'none' } }}
              onClick={() => setMobileOpen(true)}
              edge="start"
            >
              <MenuRounded />
            </IconButton>

            {title && (
              <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                {title}
              </Typography>
            )}
            {!title && <Box sx={{ flexGrow: 1 }} />}

            <IconButton onClick={toggleMode} size="small">
              {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
