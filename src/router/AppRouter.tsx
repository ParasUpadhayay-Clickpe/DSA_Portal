import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Profile } from '@/pages/Profile';
import { Leads } from '@/pages/Leads';
import { Loans } from '@/pages/Loans';
import { LoanDetail } from '@/pages/LoanDetail';
import { SubAgents } from '@/pages/SubAgents';
import { CustomerProfile } from '@/pages/CustomerProfile';

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/agent-login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/loans/:loanId" element={<LoanDetail />} />
                <Route path="/sub-agents" element={<SubAgents />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/customer/:customerId" element={<CustomerProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;

