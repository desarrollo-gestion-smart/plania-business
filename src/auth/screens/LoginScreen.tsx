import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';


const api = axios.create({
  baseURL: 'http://192.168.0.161:3000/api', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});


api.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la peticion:', error);
    return Promise.reject(error);
  }
);

interface LoginResponse {
  token: string;
  user: {
    id: string;
    phone: string;
   
  };
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modo diagnóstico mínimo para aislar crash en Login
  const DEBUG_LOGIN_MINIMAL = true;
  if (DEBUG_LOGIN_MINIMAL) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#111' }}>Login: modo diagnóstico mínimo</Text>
        <Text style={{ marginTop: 8, color: '#555' }}>Si esto no crashea, el fallo está en el UI del Login.</Text>
      </View>
    );
  }

  const validateForm = (): boolean => {
    // Validar solo el formato del teléfono (solo números y al menos 10 dígitos)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'El telefono debe contener al menos 10 digitos');
      return false;
    }

    // No validamos la contraseña aquí, el backend se encargará
    return true;
  };

  const handleLogin = async () => {
    console.log('=== INICIO DEL PROCESO DE LOGIN ===');
  
    if (!validateForm()) {
      console.log('Validacion del formulario fallida');
      return;
    }
  
    setIsLoading(true);
  
    // Datos que se enviarán al servidor
    const loginData = {
      numero: phone.trim(),
      password: password
    };
  
    console.log('=== DATOS DE INICIO DE SESIÓN ===');
    console.log('Endpoint:', '/login-business');
    console.log('Método: POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'withCredentials': true
    });
    console.log('Datos enviados:', {
      numero: loginData.numero,
      password: '••••••••' // No mostramos la contraseña por seguridad
    });
    console.log('URL completa:', 'http://192.168.0.161:3000/api/login-business');
    console.log('==============================');
  
    try {
      const response = await api.post('/login-business', loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
  
      console.log('Login exitoso:', response.data);
      
      // Verificar si la respuesta tiene los datos del negocio
      if (response.data && response.data.business) {
        const { business } = response.data;
        
        // Normalizar siempre a booleano por si backend devuelve string/number
        const isInitialSetupComplete = Boolean(
          business?.isInitialSetupComplete === true ||
          business?.isInitialSetupComplete === 'true' ||
          business?.isInitialSetupComplete === 1 ||
          business?.isInitialSetupComplete === '1'
        );
        
        // Redirigir según el estado de configuración
        if (isInitialSetupComplete) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          });
        } else {
          // Si no ha completado la configuración, ir a BusinessConfig
          navigation.reset({
            index: 0,
            routes: [{
              name: 'BusinessConfig',
              params: {
                businessId: business.id?.toString?.() ?? String(business.id),
                email: business.correo,
                phone: business.numero
              }
            }]
          });
        }
      }
      
    } catch (error) {
      console.error('Error en el inicio de sesion:', error);
      
      let errorMessage = 'Error al conectar con el servidor';
      
      if (axios.isAxiosError(error)) {
        console.log('Detalles del error Axios:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response) {
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.status === 401) {
            errorMessage = 'Credenciales incorrectas';
          } else if (error.response.status === 400) {
            errorMessage = 'Datos de inicio de sesion invalidos';
          } else if (error.response.status === 500) {
            errorMessage = 'Error interno del servidor';
          } else if (error.response.status === 404) {
            errorMessage = 'No se encontro el servidor. Verifica la URL.';
          } else if (error.response.status === 0) {
            errorMessage = 'No se pudo conectar al servidor. Verifica tu conexion a internet.';
          }
        } else if (error.request) {
          errorMessage = 'No se recibio respuesta del servidor. Verifica tu conexion.';
        } else {
          errorMessage = `Error de conexion: ${error.message}`;
        }
      } else {
        errorMessage = `Error inesperado: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      console.log('Mensaje de error mostrado al usuario:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  // Función para formatear el número de teléfono
  const formatPhoneNumber = (text: string) => {
    // Eliminar todo lo que no sea número
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoCard}>
        <View style={styles.logoContainer}>
          <Ionicons name="calendar" size={40} color="#10b981" />
          <Text style={styles.title}>PLANIA</Text>
        </View>
      </View>

      {/* Formulario */}
      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Numero de telefono"
            placeholderTextColor="#9E9E9E"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={formatPhoneNumber}
            maxLength={15}
          />
        </View>

        <View style={[styles.inputWrapper, { marginTop: 16 }]}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Contrasena"
            placeholderTextColor="#9E9E9E"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={20} 
              color="#9E9E9E" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.loginButton, 
            isLoading && styles.loginButtonDisabled
          ]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'CARGANDO...' : 'INICIAR SESION'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <View style={styles.dividerTextContainer}>
            <Text style={styles.dividerText}>o</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="apple" size={20} color="black" />
            <Text style={[styles.socialButtonText, { color: '#333' }]}>Iniciar Sesion con Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, { marginTop: 12 }]}>
            <FontAwesome name="google" size={20} color="#333333" />
            <Text style={[styles.socialButtonText, { color: '#333' }]}>Iniciar Sesion con Google</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 40,  // Más abajo
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '65%',  // Menos ancho
    minHeight: 140,  // Más alto
    maxWidth: 300,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',  // Texto en negro
    marginLeft: 12,
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
    width: '95%',
    alignSelf: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    width: '95%',
    alignSelf: 'center',
    opacity: 1,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerTextContainer: {
    paddingHorizontal: 10,
  },
  dividerText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'sans-serif-medium',
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default LoginScreen;