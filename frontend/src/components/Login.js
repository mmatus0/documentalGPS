import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

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
            const response = await axios.post(`${API}/api/auth/login`, formData);
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
            <div className="login-card">
                <div className="login-header">
                    <div className="login-brand-mark">GD</div>
                    <h1 className="login-title">DocumentalGPS</h1>
                    <p className="login-subtitle">Sistema de Gestión Documental</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}
                    <div className="field">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            name="correo"
                            placeholder="usuario@correo.com"
                            value={formData.correo}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>
                    <div className="field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="contrasenia"
                            placeholder="Tu contraseña"
                            value={formData.contrasenia}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={cargando}
                    >
                        {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;