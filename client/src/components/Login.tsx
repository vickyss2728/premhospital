import React, { useState } from 'react';
import { Lock, User, ShieldAlert, Heart } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: { username: string; role: 'owner' | 'billing' }) => void;
  palette: 'amethyst' | 'emerald';
  setPalette: (palette: 'amethyst' | 'emerald') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, palette, setPalette }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username.trim().toLowerCase(), password.trim());
      const mappedUser = {
        username: data.user.role === 'owner' ? 'Dr. Thansekar (Owner)' : 'Billing Officer',
        role: data.user.role as 'owner' | 'billing'
      };
      onLogin(mappedUser);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please check the credential hints below.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* Floating theme and palette controls in top right */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        {/* Palette Switcher Button */}
        <button
          onClick={() => setPalette(palette === 'amethyst' ? 'emerald' : 'amethyst')}
          style={{
            padding: '10px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          title="Switch Color Palette"
        >
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: palette === 'amethyst' ? '#8b5cf6' : '#10b981',
            display: 'inline-block'
          }}></span>
        </button>
      </div>

      <div className="login-card animate-fade-in">
        
        {/* Logo and Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{
            padding: '12px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            color: '#040813',
            display: 'inline-flex',
            boxShadow: 'var(--glow-primary)'
          }}>
            <Heart size={28} />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Prem Hospital</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Vadipatti, Madurai • Billing Portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.85rem',
              alignItems: 'center'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="login-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontWeight: 600,
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'var(--bg-main)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};
