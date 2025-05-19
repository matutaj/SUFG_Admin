import React from 'react';
import { Outlet } from 'react-router-dom';
import { NotificationProvider } from './NotificationContext';

const App = () => {
  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
};

export default App;
