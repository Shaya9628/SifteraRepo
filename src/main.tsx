import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>The application encountered an error and couldn't load properly.</p>
          <details style={{ marginTop: '10px' }}>
            <summary>Error Details</summary>
            <pre style={{ textAlign: 'left', marginTop: '10px', background: '#f5f5f5', padding: '10px' }}>
              {String(this.state.error)}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = createRoot(document.getElementById("root")!);

try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  root.render(
    <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
      <h1>Critical Error</h1>
      <p>Failed to initialize the application.</p>
      <pre>{String(error)}</pre>
    </div>
  );
}
