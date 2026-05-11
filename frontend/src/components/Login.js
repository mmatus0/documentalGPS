import React, { useState } from 'react';
import axios from '../services/axiosConfig';

/* ── Ícono SVG de documentación (estilo 3D isométrico verde) ── */
const DocIcon = () => (
  <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="148" rx="48" ry="8" fill="rgba(0,0,0,0.18)" />
    <rect x="38" y="30" width="76" height="98" rx="8" fill="url(#docGrad1)" />
    <rect x="32" y="22" width="76" height="98" rx="8" fill="url(#docGrad2)" />
    <rect x="26" y="14" width="76" height="98" rx="8" fill="url(#docGrad3)" />
    <rect x="38" y="38" width="48" height="5" rx="2.5" fill="#a3c9b4" />
    <rect x="38" y="50" width="52" height="4" rx="2" fill="#c5dfd0" />
    <rect x="38" y="61" width="44" height="4" rx="2" fill="#c5dfd0" />
    <rect x="38" y="72" width="50" height="4" rx="2" fill="#c5dfd0" />
    <circle cx="78" cy="92" r="22" fill="rgba(255,255,255,0.15)" />
    <circle cx="78" cy="92" r="19" fill="white" fillOpacity="0.12" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    <g transform="translate(78,92)">
      <polygon points="0,-17 3,-3 0,-1 -3,-3" fill="white" fillOpacity="0.9" />
      <polygon points="0,17 3,3 0,1 -3,3" fill="white" fillOpacity="0.7" />
      <polygon points="-17,0 -3,3 -1,0 -3,-3" fill="white" fillOpacity="0.9" />
      <polygon points="17,0 3,3 1,0 3,-3" fill="white" fillOpacity="0.7" />
      <polygon points="-12,-12 -2,-2 -1,-4 -4,-1" fill="white" fillOpacity="0.6" />
      <polygon points="12,-12 2,-2 4,-1 1,-4" fill="white" fillOpacity="0.6" />
      <polygon points="-12,12 -2,2 -4,1 -1,4" fill="white" fillOpacity="0.55" />
      <polygon points="12,12 2,2 1,4 4,1" fill="white" fillOpacity="0.55" />
      <circle cx="0" cy="0" r="3" fill="white" fillOpacity="0.95" />
    </g>
    <defs>
      <linearGradient id="docGrad1" x1="38" y1="30" x2="114" y2="128" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a8d5be" />
        <stop offset="100%" stopColor="#6eaf8e" />
      </linearGradient>
      <linearGradient id="docGrad2" x1="32" y1="22" x2="108" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#b8deca" />
        <stop offset="100%" stopColor="#82c0a0" />
      </linearGradient>
      <linearGradient id="docGrad3" x1="26" y1="14" x2="102" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="100%" stopColor="rgba(200,230,215,0.85)" />
      </linearGradient>
    </defs>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ correo: '', contrasenia: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [focusField, setFocusField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.correo || !formData.contrasenia) {
      setError('Completa todos los campos');
      return;
    }
    setCargando(true);
    try {
      const response = await axios.post('/api/auth/login', formData);
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      onLogin(usuario);
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px 11px 40px',
    borderRadius: 10,
    border: `1.5px solid ${focusField === field ? '#1a6b47' : '#e2e8f0'}`,
    fontSize: 14,
    color: '#1e293b',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: "'Inter', system-ui, sans-serif",
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 840,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
        minHeight: 500,
      }}>
        {/* Panel izquierdo */}
        <div style={{
          width: '42%',
          background: 'linear-gradient(180deg, #1a5c3a 0%, #2d7a55 35%, #4a9e72 65%, #c8e8d5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '30px 24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', width: 260, height: 260,
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
            top: -80, right: -80, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 180, height: 180,
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)',
            bottom: 20, left: -60, pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', zIndex: 1 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
              letterSpacing: '0.03em',
            }}>GD</div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>DocumentalGPS</div>
              <div style={{ color: 'rgba(180,230,200,0.85)', fontSize: 10.5 }}>Sistema de Gestión Documental</div>
            </div>
          </div>

          {/* Ícono */}
          <div style={{ zIndex: 1, margin: '8px 0' }}>
            <DocIcon />
          </div>

          {/* Texto */}
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <p style={{
              color: 'rgba(200,235,215,0.85)', fontSize: 12,
              fontWeight: 500, margin: '0 0 6px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Bienvenido al sistema
            </p>
            <h2 style={{
              color: 'white', fontSize: 19, fontWeight: 700,
              lineHeight: 1.4, margin: 0, textAlign: 'center',
            }}>
              Gestión documental<br />centralizada
            </h2>
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{
          flex: 1, background: 'white',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '44px 42px',
        }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
            Iniciar sesión
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 28px' }}>
            Ingrese con sus credenciales corporativas
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 7 }}>
                Correo electrónico:
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <MailIcon />
                </span>
                <input
                  type="email" name="correo" value={formData.correo}
                  onChange={handleChange}
                  onFocus={() => setFocusField('correo')}
                  onBlur={() => setFocusField(null)}
                  placeholder="usuario@correo.com"
                  autoComplete="email"
                  style={inputStyle('correo')}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 7 }}>
                Contraseña:
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <LockIcon />
                </span>
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  name="contrasenia" value={formData.contrasenia}
                  onChange={handleChange}
                  onFocus={() => setFocusField('contrasenia')}
                  onBlur={() => setFocusField(null)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  style={{ ...inputStyle('contrasenia'), paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1,
                  }}
                >
                  <EyeIcon open={mostrarPass} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: cargando ? '#6b9e84' : 'linear-gradient(135deg, #1f6b45 0%, #155234 100%)',
                color: 'white', fontSize: 14.5, fontWeight: 600,
                cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                letterSpacing: '0.01em',
                boxShadow: cargando ? 'none' : '0 2px 10px rgba(15,70,40,0.3)',
              }}
            >
              {cargando ? 'Iniciando sesión...' : 'Ingresar al sistema'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                style={{
                  background: 'none', border: 'none',
                  color: '#475569', fontSize: 13,
                  cursor: 'pointer', textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                Olvidé mi contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
