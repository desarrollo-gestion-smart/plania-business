import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthStackParamList, VerificationCodeParams } from '../../navigation/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';

const CODE_LENGTH = 6;

type VerificationCodeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'VerificationCode'>;

const VerificationCodeScreen: React.FC = () => {
  const navigation = useNavigation<VerificationCodeScreenNavigationProp>();
  const route = useRoute();
  const { email, businessId, phone } = route.params as VerificationCodeParams;
  
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  
  // Mostrar los datos recibidos para depuración
  console.log('Datos recibidos en VerificationCodeScreen:', { email, businessId, phone });

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto focus next input
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== CODE_LENGTH) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación completo');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Crear instancia de axios para la verificación
      const api = axios.create({
        baseURL: 'http://192.168.0.161:3000/api',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
      });
      
      // Datos para la verificación en el formato que espera el backend
      const verificationData = {
        id: businessId, // El ID del negocio que se obtuvo en el registro
        code: verificationCode
      };
      
      console.log('Enviando datos de verificación:', verificationData);
      
      // Hacer la llamada al endpoint de verificación
      const response = await api.post('/verify-business', verificationData);
      
      console.log('Respuesta de verificación:', response.data);
      
      if (response.status >= 200 && response.status < 300) {
        // Código verificado correctamente
        Alert.alert(
          '¡Verificación exitosa!', 
          'Tu cuenta ha sido verificada correctamente. Por favor inicia sesión.',
          [
            {
              text: 'Aceptar',
              onPress: () => {
                // Navegar a la pantalla de Login
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Error al verificar el código');
      }
    } catch (error: any) {
      console.error('Error al verificar el código:', error);
      
      let errorMessage = 'Ocurrió un error al verificar el código. Por favor, inténtalo de nuevo.';
      
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Código de verificación inválido';
        } else if (error.response.status === 404) {
          errorMessage = 'No se encontró la solicitud de verificación';
        } else if (error.response.status === 410) {
          errorMessage = 'El código ha expirado. Por favor, solicita un nuevo código.';
        }
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      
      const api = axios.create({
        baseURL: 'http://192.168.0.161:3000/api',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
      });
      
      if (!businessId) {
        throw new Error('No se encontró el ID del negocio para reenviar el código');
      }
      
      // Datos para el reenvío del código en el formato que espera el backend
      const resendData = { id: businessId };
      
      console.log('Solicitando reenvío de código para el negocio ID:', businessId);
      
      // Hacer la llamada al endpoint de reenvío de código para negocios
      const response = await api.post('/resend-business', resendData);
      
      if (response.status >= 200 && response.status < 300) {
        Alert.alert(
          'Código reenviado', 
          'Hemos enviado un nuevo código de verificación a tu correo electrónico.'
        );
      } else {
        throw new Error(response.data?.message || 'Error al reenviar el código');
      }
    } catch (error: any) {
      console.error('Error al reenviar el código:', error);
      
      let errorMessage = 'No se pudo reenviar el código. Por favor, inténtalo de nuevo.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'No se encontró una solicitud de verificación para este correo.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create refs for the input fields
  const inputRefs = React.useRef<(TextInput | null)[]>([]);
  
  // Initialize refs array
  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, CODE_LENGTH);
  }, [CODE_LENGTH]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >

                 <Ionicons name="arrow-back" size={24} color="#10b981" />
              </TouchableOpacity>
      <View style={styles.logoContainer}>
        
                  <Ionicons name="calendar" size={40} color="#10b981" />
                  <Text style={styles.title}>PLANIA</Text>

                </View>
                </View>
     

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.screenTitle}>Ingrese código</Text>
        
        <View style={styles.codeContainer}>
          {Array(CODE_LENGTH)
            .fill(0)
            .map((_, index) => (
              <TextInput
                key={index}
                ref={el => {
                  if (el) {
                    inputRefs.current[index] = el;
                  }
                }}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={1}
                value={code[index]}
                onChangeText={text => handleCodeChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
        </View>

        <TouchableOpacity 
          style={styles.resendLink} 
          onPress={handleResendCode}
          disabled={isLoading}>
          <Text style={styles.resendText}>
            ¿No te ha llegado el código? <Text style={styles.resendLinkText}>oprime aquí</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonsContainer}>
          <View style={[styles.buttonWrapper, { alignItems: 'center' }]}>
            <TouchableOpacity 
              style={[styles.button, styles.resendButton]} 
              onPress={handleResendCode}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>REENVIAR CÓDIGO</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.buttonWrapper, { alignItems: 'center', marginTop: 15 }]}>
            <TouchableOpacity 
              style={[styles.buttonRegister]} 
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              <Text style={[styles.buttonTextRegister, styles.buttonTextRegister]}>REGISTRARSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'center', // Centra los elementos horizontalmente
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 10,
    position: 'relative', // Para posicionar el botón de volver
  },
  backButton: {
    padding: 10,
    position: 'absolute',
    left: 20,
    top: 10,
  },
 
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
    marginTop:40,
    backgroundColor:'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    width: '65%',  // Menos ancho
    minHeight: 100,  // Más alto
    maxWidth: 300,
    justifyContent: 'center',
  },
 
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  headerSpacer: {
    width: 10, // Same as back button width for balance
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#111827',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  resendLink: {
    marginBottom: 30,
    alignItems: 'center',
  },
  resendText: {
    color: '#6b7280',
    fontSize: 14,
  },
  resendLinkText: {
    color: '#10b981',
    fontWeight: '600',
  },
  buttonsContainer: {
    marginTop: 2,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '80%',
    marginBottom: 10,
    alignItems: 'center',
  },
  button: {
    padding: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    minHeight: 40,
  },
  resendButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verifyButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
  },
  verifyButtonText: {
    color: '#fff',
  },

  buttonTextRegister:{
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    padding:5,
  },
  buttonRegister:{
    width:'98%',
    alignSelf:'center',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop:300,
    backgroundColor: '#10b981',
  }
});

export default VerificationCodeScreen;
