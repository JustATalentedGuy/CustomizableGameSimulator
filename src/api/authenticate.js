const BASE_URL = import.meta.env.VITE_DJANGO_API;

export const onLogin = async (username, password) => {
    try {
        const response = await fetch(`${BASE_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            return false;
        }
        const data = await response.json();
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        return true;
    }
    catch (error) {
        console.error('Error while logging in:', error);
        return false;
    }        
};

export const onRegister = async (username, password) => {
    try {
        const response = await fetch(`${BASE_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
    } catch (error) {
        console.error('Error while registering:', error);
    }
}