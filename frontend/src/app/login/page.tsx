'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    router.push('/');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const ok = await login(email, password);
        if (ok) {
          router.push('/');
        } else {
          setError('Invalid email or password credentials.');
        }
      } else {
        const ok = await register(email, password, fullName);
        if (ok) {
          router.push('/');
        } else {
          setError('Registration failed. Email may already be in use.');
        }
      }
    } catch {
      setError('An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="animate-in"
      style={{
        maxWidth: '440px',
        margin: '60px auto',
        padding: '0 16px',
      }}
    >
      <div className="glass-panel" style={{ padding: '36px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
              color: '#fff',
              fontSize: '1.4rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            J
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>JIGYASA Intelligence</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enterprise AI Market Intelligence Portal
          </p>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'login' ? 'var(--primary-accent)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'register' ? 'var(--primary-accent)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Full Name
              </label>
              <input
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Analyst"
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Work Email *
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@jigyasa.ai"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Password *
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={isSubmitting || !email.trim() || !password.trim()}
          >
            {isSubmitting
              ? mode === 'login'
                ? 'Authenticating...'
                : 'Creating Account...'
              : mode === 'login'
              ? '🔑 Sign In'
              : '🚀 Register Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
