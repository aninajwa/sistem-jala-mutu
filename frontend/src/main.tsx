import { createRoot } from 'react-dom/client';

import AuthGate from './auth/AuthGate';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import './workflow/operational.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <AuthGate />
  </ErrorBoundary>,
);
