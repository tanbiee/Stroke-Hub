import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3000/api/auth';

// Simple JWT decode (no library needed)
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount / token change, decode user from token
    useEffect(() => {
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser({ id: decoded.id, username: decoded.username });
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                // Token expired
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const register = async (username, email, password) => {
        const res = await axios.post(`${API_URL}/register`, { username, email, password });
        return res.data;
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        const { token: newToken } = res.data;
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
