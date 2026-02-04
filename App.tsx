import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './Onboarding';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/auth/context/AuthContext';
import { enableScreens } from 'react-native-screens';

enableScreens(false);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any; info?: any }>{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error);
    console.error('Component stack:', info?.componentStack);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, color: '#b91c1c', textAlign: 'center' }}>
            Se produjo un error en la UI. Revisa la consola para detalles.
          </Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* StatusBar temporalmente desactivado para aislar crash Fabric */}
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [debugMinimal, setDebugMinimal] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingCompleted');
        setOnboardingCompleted(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    setOnboardingCompleted(true);
  };

  if (debugMinimal) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#111' }}>Modo diagnóstico mínimo</Text>
          <Text style={{ marginTop: 8, color: '#555' }}>Si esto no crashea, el fallo está en la navegación o pantallas.</Text>
        </View>
      </View>
    );
  }

  if (onboardingCompleted === null) {
    // Pantalla de carga mientras se verifica el estado del onboarding
    return <View style={styles.container} />;
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
