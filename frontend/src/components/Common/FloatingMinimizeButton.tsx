import React from 'react';
import { Fab, Typography, Box } from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAtom } from 'jotai';
import { minimizedModalsAtom, activeTabIdAtom } from '../../atoms/tabAtoms';

const FloatingMinimizeButton: React.FC = () => {
  const [activeTabId] = useAtom(activeTabIdAtom);
  const [minimizedModals, setMinimizedModals] = useAtom(minimizedModalsAtom);

  const activeMinimizedData = minimizedModals[activeTabId];

  if (!activeMinimizedData || !activeMinimizedData.isMinimized) {
    return null;
  }

  const handleRestore = () => {
    setMinimizedModals((prev) => ({
      ...prev,
      [activeTabId]: {
        ...prev[activeTabId],
        restoring: true,
      },
    }));
  };
  
  const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newModals = { ...minimizedModals };
      delete newModals[activeTabId];
      setMinimizedModals(newModals);
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}>
      <Fab
        variant="extended"
        color="primary"
        onClick={handleRestore}
        sx={{
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          textTransform: 'none',
          bgcolor: '#1976d2',
          '&:hover': { bgcolor: '#1565c0' },
          pr: 1
        }}
      >
        <EditIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
          {'Đang soạn...'}
        </Typography>
        <Box 
            onClick={handleCancel} 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                p: 0.5, 
                borderRadius: '50%',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
        >
            <CloseIcon sx={{ fontSize: 16 }} />
        </Box>
      </Fab>
    </Box>
  );
};

export default FloatingMinimizeButton;
