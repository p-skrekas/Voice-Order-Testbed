import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { AppSidebar } from './components/custom/app-sidebar';
import { Mail } from 'lucide-react';
import { CustomToaster } from "./components/custom/CustomToaster";

import Index from './pages/Index';
import TestCatalog from './pages/SyntheticVoiceDataset';
import RecordedVoices from './pages/RecordedVoices';
import Chat from './pages/Chat';
import TranscriptionBenchmarking from './pages/TranscriptionBenchmarking';
import Settings from './pages/Settings';
const allowedPassword = 'mouhalis';



function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.split('@')[1] === 'reborrn.com' && password === allowedPassword) {
      onLogin(email);
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className='flex flex-col w-full items-center justify-center h-screen gap-4'>
      <span className='text-2xl font-bold'>
        Mouhalis Voice Order
      </span>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className='flex flex-col w-[400px] items-center justify-center gap-4'>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          className='w-full'
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
        <Button variant="default" type="submit">Login</Button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

function UserEmailDisplay({ email }: { email: string }) {
  return (
    <div className="text-sm text-gray-600 flex items-center gap-2 bg-gray-100 p-2 rounded-md">
      <Mail size={16} />
      {email}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <Router>
      <SidebarProvider>
        <CustomToaster />
        <div className="flex w-full h-screen">
          {isAuthenticated && <AppSidebar onLogout={handleLogout} />}
          <div className="flex w-full flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <Index />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/recorded-voices"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <RecordedVoices />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/chat"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <Chat />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/settings"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <Settings />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              />
              {/* <Route
                path="/transcription-benchmarking"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <TranscriptionBenchmarking />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              /> */}
              <Route
                path="/login"
                element={<Login onLogin={handleLogin} />}
              />
              <Route
                path="/synthetic-voice-orders"
                element={
                  isAuthenticated ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center p-4 border-b">
                        <SidebarTrigger />
                        <UserEmailDisplay email={userEmail} />
                      </div>
                      <TestCatalog />
                    </div>
                  ) : <Navigate to="/login" replace />
                }
              />
            </Routes>
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
}

export default App;
