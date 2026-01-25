import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { errorService } from '@/services/error.service';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary] Caught error:', error, errorInfo);
    errorService.capture(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    const MAX_RETRIES = 3;

    if (retryCount < MAX_RETRIES) {
      logger.info('[ErrorBoundary] Retrying after error, attempt:', retryCount + 1);
      this.setState(prev => ({ retryCount: prev.retryCount + 1 }));
      this.handleReset();
    } else {
      logger.warn('[ErrorBoundary] Max retries reached');
    }
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const canRetry = retryCount < 3;
      // @ts-ignore
      // Safe runtime check for __DEV__
      let isDev = false;
      try {
        const dev = (global as any).__DEV__;
        isDev = dev === true || process.env.NODE_ENV === 'development';
      } catch {
        isDev = process.env.NODE_ENV === 'development';
      }
      const userMessage = errorService.getUserMessage(error);

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>{userMessage}</Text>

            {/* TEMPORARY: Always show debug info to diagnose TestFlight crash */}
            {error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{error.toString()}</Text>
                <Text style={styles.debugText}>
                  {'\n'}Stack: {error.stack || 'No stack trace'}
                </Text>
                {errorInfo && (
                  <Text style={styles.debugText}>
                    {'\n'}Component: {errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.actions}>
              {canRetry && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={this.handleRetry}
                >
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={this.handleReset}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  debugContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

