import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-teal-500 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-2xl font-bold text-teal-800 mb-4">Something went wrong</h2>
            <p className="text-red-500 mb-4">{this.state.error?.message || 'An error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-amber-500 text-teal-900 rounded-lg hover:bg-amber-400"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;