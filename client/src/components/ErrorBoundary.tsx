import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RideX UI Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F8F9] flex items-center justify-center p-6 text-[#222B45]">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-xl border border-[#EDF1F7] text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-[#222B45]">Something unexpected occurred</h2>
            <p className="text-xs text-[#8F9BB3]">
              {this.state.error?.message || 'An interface error was caught by the RideX ErrorBoundary.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/auth';
                }}
                className="px-4 py-2.5 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold text-xs rounded-[12px] shadow-sm transition"
              >
                Go to Sign-In
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-[#F7F8F9] hover:bg-[#E4E9F2] text-[#4B545A] font-bold text-xs rounded-[12px] border border-[#EDF1F7] transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
