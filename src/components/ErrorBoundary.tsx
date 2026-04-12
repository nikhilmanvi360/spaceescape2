import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "A critical system failure has occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Security Protocol Violation: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full tech-card p-8 border-destructive/50 bg-destructive/5 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-destructive uppercase tracking-widest italic">System Crash</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-70">Error Code: {isFirestoreError ? 'SEC_VIOLATION' : 'RUNTIME_ERR'}</p>
            </div>

            <div className="p-4 bg-black/40 border border-destructive/20 rounded text-xs text-destructive/80 break-words font-mono">
              {errorMessage}
            </div>

            <Button 
              onClick={this.handleReset}
              className="tech-button w-full h-12 text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reboot Systems
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
