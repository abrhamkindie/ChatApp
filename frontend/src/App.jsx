import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Hero from './components/Hero'

 import ProtectedRoute from './components/ProtectedRoute'
 import { AuthContext } from './context/AuthContext';

function App() {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-teal-500 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
         <Route
        path="/"
        element={currentUser ? <Navigate to="/chat" replace /> : <Hero />}
      />
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/chat" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={currentUser ? <Navigate to="/chat" replace /> : <Register />}
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
              <Chat />
          </ProtectedRoute>
         
        }
      />
      <Route path="/" element={<Navigate to={currentUser ? '/chat' : '/login'} replace />} />
    </Routes>
  );
}

export default App;