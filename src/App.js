import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initializeApi } from '@api/axiosConfig';
import { ProtectedRoute } from '@middleware/ProtectedRoute';
import { LoginPage } from '@components/pages/LoginPage/LoginPage';
import { DashboardPage } from '@components/pages/DashboardPage/DashboardPage';
import '@styles/globals.scss';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize API with interceptors
    initializeApi();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Feature pages will be added here */}
        <Route path="/customers" element={<ProtectedRoute><div>Customers Page</div></ProtectedRoute>} />
        <Route path="/menus" element={<ProtectedRoute><div>Menus Page</div></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><div>Reservations Page</div></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><div>Inventory Page</div></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><div>Sales Page</div></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
