import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button } from 'react-native';
import AuthNavigator from './AuthNavigator';
import { useAuthContext } from '../auth/context/AuthContext';

// Placeholder Main Navigator
const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
    <Button title="Logout" onPress={() => {}} />
  </View>
);

const MainStack = createStackNavigator();

const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      animationEnabled: true,
      freezeOnBlur: false,
    }}
  >
    <MainStack.Screen name="Home" component={HomeScreen} />
  </MainStack.Navigator>
);

const RootNavigator = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;