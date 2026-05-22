import React, { useState } from 'react';
import axios from '../services/axiosConfig';

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({ correo: '', contrasenia: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPass, setMostrarPass] = useState(false);

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

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f1f5f4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                maxWidth: 860,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                minHeight: 480,
            }}>
                {/* Panel izquierdo */}
                <div style={{
                    width: '44%',
                    background: '#0f4c3a',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '32px 28px',
                    position: 'relative',
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: '#1d9e75',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'white',
                        }}>GD</div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>DocumentalGPS</div>
                            <div style={{ color: '#9fe1cb', fontSize: 11 }}>Sistema de Gestión Documental</div>
                        </div>
                    </div>

                    {/* Texto inferior */}
                    <div>
                        <span style={{
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.10)',
                            color: '#9fe1cb',
                            fontSize: 11, padding: '3px 12px',
                            borderRadius: 20, marginBottom: 12,
                        }}>
                            Sistema Documental
                        </span>
                        <h2 style={{
                            color: 'white', fontSize: 22,
                            fontWeight: 700, lineHeight: 1.35,
                            margin: '0 0 10px',
                        }}>
                            Gestión documental centralizada
                        </h2>
                        <p style={{ color: '#9fe1cb', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                            Accede para revisar, aprobar y gestionar los expedientes de tu organización.
                        </p>
                    </div>
                </div>

                {/* Panel derecho */}
                <div style={{
                    flex: 1,
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '40px 36px',
                }}>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                        Iniciar sesión
                    </h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>
                        Ingresa con tus credenciales corporativas
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
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: 'block', fontSize: 13,
                                fontWeight: 500, color: '#475569', marginBottom: 6,
                            }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="usuario@correo.com"
                                autoComplete="email"
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    borderRadius: 8, border: '1px solid #e2e8f0',
                                    fontSize: 14, color: '#1e293b',
                                    background: '#f8fafc',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: 'block', fontSize: 13,
                                fontWeight: 500, color: '#475569', marginBottom: 6,
                            }}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={mostrarPass ? 'text' : 'password'}
                                    name="contrasenia"
                                    value={formData.contrasenia}
                                    onChange={handleChange}
                                    placeholder="Tu contraseña"
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%', padding: '10px 42px 10px 14px',
                                        borderRadius: 8, border: '1px solid #e2e8f0',
                                        fontSize: 14, color: '#1e293b',
                                        background: '#f8fafc',
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarPass(!mostrarPass)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', padding: 0, lineHeight: 1,
                                        color: '#94a3b8',
                                    }}
                                >
                                    <i className={`bi ${mostrarPass ? 'bi-eye-slash' : 'bi-eye'}`}
                                       style={{ fontSize: 16 }} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            style={{
                                width: '100%', padding: '11px',
                                borderRadius: 8, border: 'none',
                                background: cargando ? '#6b7280' : '#0f4c3a',
                                color: 'white', fontSize: 14,
                                fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            {cargando ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;