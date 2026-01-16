import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
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
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        padding: '40px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2><i className="bi bi-box-arrow-in-right"></i> Login</h2>
          <p style={{ color: '#666', margin: 0 }}>Delivery Service</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: '12px',
              fontWeight: '600',
              borderRadius: '8px'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px',
          fontSize: '0.9rem'
        }}>
          <h6 style={{ color: '#495057', marginBottom: '10px', fontWeight: '600' }}>
            Test Credentials:
          </h6>
          <div style={{ margin: '5px 0', color: '#666' }}>
            <strong>Admin:</strong> admin / password123
          </div>
          <div style={{ margin: '5px 0', color: '#666' }}>
            <strong>Rider:</strong> rider1 / password123
          </div>
          <div style={{ margin: '5px 0', color: '#666' }}>
            <strong>Customer:</strong> customer1 / password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
