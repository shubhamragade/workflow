import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const storedUser = localStorage.getItem('context_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        config.headers['X-User-ID'] = user.id;
    }
    return config;
});

export default api;
