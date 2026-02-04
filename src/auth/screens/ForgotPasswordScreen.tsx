import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthContext } from '../context/AuthContext';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');

  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { resetPassword, loading, error } = useAuthContext();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReset = async () => {
    setSuccess('');
    if (!email.trim()) {
      return;
    }
    if (!validateEmail(email)) {
      return;
    }

    try {
      await resetPassword({ email });
      setSuccess('Password reset email sent successfully. Please check your email.');
      setEmail('');
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email input field"
        style={styles.input}
      />
      {error ? <HelperText type="error">{error}</HelperText> : null}
      {success ? <HelperText type="info">{success}</HelperText> : null}
      <Button
        mode="contained"
        onPress={handleSendReset}
        loading={loading}
        disabled={loading}
        accessibilityLabel="Send reset email button"
        style={styles.button}
      >
        <Text>{loading ? 'Sending...' : 'Send Reset Email'}</Text>
      </Button>
      <View style={styles.linksContainer}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Navigate to login screen"
        >
          <Text>Back to Login</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  linksContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default ForgotPasswordScreen;