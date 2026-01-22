import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import safeStorage from '../utils/storage';
import '../App.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[LoginPage] Attempting login for username:', username);
      const result = await login(username, password);
      
      if (result.success) {
        console.log('[LoginPage] Login successful, redirecting...');
        
        // Get user data from localStorage (set by AuthContext.login)
        const storedUser = JSON.parse(safeStorage.getItem('user') || '{}');
        const role = storedUser.role || storedUser.Role;
        
        console.log('[LoginPage] User role:', role);
        console.log('[LoginPage] User data:', storedUser);
        
        // Redirect based on role
        if (role === 'Admin' || role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'Rider' || role === 'rider') {
          navigate('/rider/dashboard');
        } else if (role === 'Customer' || role === 'customer') {
          navigate('/customer/track');
        } else {
          console.error('[LoginPage] Unknown role:', role);
          setError('Unknown role. Please contact administrator.');
        }
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div style={{
    backgroundColor: '#F7F5F2', // light coffee background
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  }}>
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: '0 12px 30px rgba(59, 48, 42, 0.12)',
      padding: '40px',
      maxWidth: '420px',
      width: '100%',
      border: '1px solid rgba(59,48,42,0.08)'
    }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontWeight: 700,
          color: '#3B302A',
          marginBottom: '6px'
        }}>
          Welcome to Kapebara
        </h2>
        <p style={{
          color: '#7A6E66',
          margin: 0,
          fontSize: '0.95rem'
        }}>
          Delivery Service Login
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" style={{ color: '#3B302A', fontWeight: 600 }}>
            Username
          </label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '10px',
              borderColor: 'rgba(59,48,42,0.2)'
            }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" style={{ color: '#3B302A', fontWeight: 600 }}>
            Password
          </label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '10px',
              borderColor: 'rgba(59,48,42,0.2)'
            }}
          />
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          className="btn w-100"
          disabled={loading}
          style={{
            backgroundColor: '#3B302A',
            color: '#FFFFFF',
            padding: '12px',
            fontWeight: 600,
            borderRadius: '12px',
            border: 'none'
          }}
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      {/* TEST CREDENTIALS */}
      <div style={{
        background: '#FAF9F7',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '24px',
        fontSize: '0.85rem',
        border: '1px dashed rgba(59,48,42,0.15)'
      }}>
        <h6 style={{
          color: '#3B302A',
          marginBottom: '10px',
          fontWeight: 700
        }}>
          Test Credentials
        </h6>

        <div style={{ color: '#6E625A', marginBottom: '6px' }}>
          <strong>Admin:</strong> admin / password123
        </div>
        <div style={{ color: '#6E625A', marginBottom: '6px' }}>
          <strong>Rider:</strong> rider1 / password123
        </div>
        <div style={{ color: '#6E625A' }}>
          <strong>Customer:</strong> customer1 / password123
        </div>
      </div>
    </div>
  </div>
);
};

export default LoginPage;
