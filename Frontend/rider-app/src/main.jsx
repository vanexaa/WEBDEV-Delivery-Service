import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

console.log('Rider App: Starting React application...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('Rider App: React application mounted successfully');
} catch (error) {
  console.error('Rider App: Error mounting React application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background-color: #f5f5f5; min-height: 100vh;">
      <div style="max-width: 600px; margin: 50px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #dc3545;">Application Error</h2>
        <p>There was an error loading the Rider App:</p>
        <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto;">${error.message}\n${error.stack}</pre>
        <p>Please check the browser console (F12) for more details.</p>
      </div>
    </div>
  `;
}
