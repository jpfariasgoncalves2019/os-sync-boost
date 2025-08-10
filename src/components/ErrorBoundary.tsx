import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || 'Erro inesperado' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-4">{this.state.message}</p>
          <button className="underline" onClick={() => this.setState({ hasError: false, message: undefined })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}
