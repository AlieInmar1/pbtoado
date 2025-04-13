import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { FunctionProviderComponent } from './contexts/FunctionContext';
import { DatabaseProviderComponent } from './contexts/DatabaseContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseProviderComponent>
      <FunctionProviderComponent>
        <App />
      </FunctionProviderComponent>
    </DatabaseProviderComponent>
  </StrictMode>
);
