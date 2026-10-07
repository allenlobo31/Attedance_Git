import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Admin from './Admin.jsx';
import './styles.css';

const isAdmin = window.location.pathname === '/admin' || window.location.hash === '#/admin';

createRoot(document.getElementById('root')).render(isAdmin ? <Admin /> : <App />);
