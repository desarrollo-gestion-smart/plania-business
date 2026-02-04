import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../auth/screens/LoginScreen';
import RegisterScreen from '../auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../auth/screens/ForgotPasswordScreen';
import VerificationCodeScreen from '../auth/screens/VerificationCodeScreen';
import BusinessConfigScreen from '../business/screens/BusinessConfigScreen';
import StaffSetupScreen from '../business/screens/StaffSetupScreen';
import BusinessHomeScreen from '../business/screens/BusinessHomeScreen';

export type VerificationCodeParams = {
  email: string;
  businessId?: number;
  phone?: string;
};

export type StaffSetupItem = {
  id: number | string;
  avatar: string;
  nombre?: string;
  apellido?: string;
  numero?: string;
  password?: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerificationCode: VerificationCodeParams;
  BusinessConfig: {
    businessId: string;
    email: string;
    phone: string;
    userId?: string | number;
  };
  MainApp: undefined; // Añadimos MainApp al stack de autenticación
  StaffSetup: { staff: StaffSetupItem[]; businessId?: number | string }; // Pantalla para configurar profesionales con IDs
  BusinessHome: { businessId?: number | string; businessName?: string; avatarUrl?: string } | undefined; // Parametrizamos BusinessHome
};
const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animationEnabled: true,
        // Aseguramos booleanos adecuados para react-native-screens
        freezeOnBlur: false,
      }}
    >
      {/* Reducimos a una sola pantalla para aislar el crash */}
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};
export default AuthNavigator;