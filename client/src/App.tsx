import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { AppSidebar } from './components/custom/app-sidebar';


import Index from './pages/Index';
import TestCatalog from './pages/SyntheticVoiceDataset';
import RecordedVoices from './pages/RecordedVoices';
import TranscriptionBenchmarking from './pages/TranscriptionBenchmarking';
const allowedEmails = ['paschalis.skrekas@reborrn.com'];
const allowedPassword = 'admin';

function Home() {
  return <h1 className="text-3xl font-bold underline">Hello world!</h1>;
}

function About() {
  return <h1>About Page</h1>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allowedEmails.includes(email) && password === allowedPassword) {
      onLogin();
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen gap-4'>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center gap-4'>
        <Input
          type="email"
          placeholder="Email"
          value={email}
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


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <Router>
      <SidebarProvider>
        <div className="flex w-full h-screen">
          {isAuthenticated && <AppSidebar onLogout={handleLogout} />}
          <div className="flex w-full flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <>
                      <SidebarTrigger />
                      <Index />
                    </>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/recorded-voices"
                element={
                  isAuthenticated ? (
                    <>
                      <SidebarTrigger />
                      <RecordedVoices />
                    </>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/transcription-benchmarking"
                element={
                  isAuthenticated ? (
                    <>
                      <SidebarTrigger />
                      <TranscriptionBenchmarking />
                    </>
                  ) : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/login"
                element={<Login onLogin={handleLogin} />}
              />
              <Route
                path="/test-catalog"
                element={
                  isAuthenticated ? (
                    <>
                      <SidebarTrigger />
                      <TestCatalog />
                    </>
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
