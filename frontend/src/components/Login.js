import React, { useState } from 'react';
import axios from '../services/axiosConfig';

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({ correo: '', contrasenia: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

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
        } catch (error) {
            setError('Correo o contraseña incorrectos');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
                <div className="card-body p-5">
 
                    {/* Brand */}
                    <div className="text-center mb-4">
                        <div className="login-brand-mark">GD</div>
                        <h1 className="h4 fw-bold mb-1">DocumentalGPS</h1>
                        <p className="text-muted small">Sistema de Gestión Documental</p>
                    </div>
 
                    {/* Error */}
                    {error && (
                        <div className="alert alert-danger py-2 small" role="alert">
                            {error}
                        </div>
                    )}
 
                    {/* Formulario */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-medium">Correo electrónico</label>
                            <input
                                type="email"
                                name="correo"
                                className="form-control"
                                placeholder="usuario@correo.com"
                                value={formData.correo}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-medium">Contraseña</label>
                            <input
                                type="password"
                                name="contrasenia"
                                className="form-control"
                                placeholder="Tu contraseña"
                                value={formData.contrasenia}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
                            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </button>
                    </form>
 
                </div>
            </div>
        </div>
    );
};

export default Login;