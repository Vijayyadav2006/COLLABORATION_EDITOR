import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './component/App'; // Corrected import path for App component
import reportWebVitals from './component/reportWebVitals';


const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
reportWebVitals();