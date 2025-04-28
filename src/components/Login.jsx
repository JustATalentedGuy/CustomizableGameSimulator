import React, { useState } from 'react';
import { onLogin } from '../api/authenticate';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        const success = await onLogin(username, password);
        if (success) {
            login(username);
            navigate('/create-room');
        }
        else {
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="login-container">
          <div className="login-box">
            <h1>Login</h1>
    
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
    
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
    
            {error && <p className="error-message">{error}</p>}
    
            <button onClick={handleLogin}>Login</button>
    
            <p>
              Don't have an account? <a href="/register">Register</a>
            </p>
          </div>
        </div>
    );
};

export default Login;