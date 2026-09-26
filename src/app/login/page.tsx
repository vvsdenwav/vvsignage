"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    if (res?.error) {
      setError("Invalid username or password");
      setIsLoading(false);
    } else {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if ((session?.user as any)?.role === "SUPER_ADMIN") {
        window.location.href = "/super-admin";
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      
      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeIn 0.6s ease-out forwards'
      }}>
        
        {/* Massive Logo (No Container) */}
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{ 
            width: '240px', 
            height: '110px', 
            objectFit: 'contain',
            marginBottom: '32px'
          }} 
        />

        {/* Minimal Form Card */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(44, 76, 124, 0.05), 0 1px 3px rgba(44, 76, 124, 0.02)',
          border: '1px solid var(--border)'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            marginBottom: '6px',
            textAlign: 'center'
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginBottom: '32px',
            textAlign: 'center',
            fontWeight: '400'
          }}>
            Sign in to manage your digital displays.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '13px',
                color: '#dc2626',
                fontWeight: '500',
                textAlign: 'center',
                animation: 'shake 0.4s ease-in-out'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  height: '48px',
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: 'var(--foreground)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--brand-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(44, 76, 124, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  height: '48px',
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: 'var(--foreground)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--brand-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(44, 76, 124, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              style={{
                marginTop: '16px',
                height: '48px',
                width: '100%',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: (isLoading || !username || !password) ? 'var(--brand-primary-hover)' : 'var(--brand-primary)',
                opacity: (isLoading || !username || !password) ? 0.7 : 1,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (isLoading || !username || !password) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => { if (!isLoading && username && password) e.currentTarget.style.backgroundColor = 'var(--brand-primary-hover)' }}
              onMouseLeave={e => { if (!isLoading && username && password) e.currentTarget.style.backgroundColor = 'var(--brand-primary)' }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Global Keyframes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
        `}} />

      </div>
    </div>
  );
}
