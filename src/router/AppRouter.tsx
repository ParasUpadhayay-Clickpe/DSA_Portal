import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Profile } from '@/pages/Profile';

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/agent-login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;

