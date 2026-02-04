import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import PasswordToggleIcon from '../../ui/PasswordToggleIcon';
import axios from 'axios';

const { width } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const validateForm = (): boolean => {
    console.log('Validando formulario de registro...');
    console.log('Datos a validar:', { name, email, phone, password, confirmPassword });

    if (!name.trim()) {
      console.log('Validación fallida: nombre vacío');
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return false;
    }

    if (password.length < 6) {
      console.log('Validación fallida: contraseña muy corta');
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!email.trim()) {
      console.log('Validación fallida: email vacío');
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      console.log('Validación fallida: email inválido');
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      console.log('Validación fallida: teléfono inválido');
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido');
      return false;
    }
    if (!password) {
      console.log('Validación fallida: contraseña vacía');
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }
    if (password !== confirmPassword) {
      console.log('Validación fallida: contraseñas no coinciden');
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    console.log('Validación exitosa');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const userData = {
      nombre: name.trim(),
      correo: email.trim().toLowerCase(),
      numero: phone.trim(),
      password: password,
      terms: acceptTerms,
    };
    
    if (!acceptTerms) {
      Alert.alert('Términos y condiciones', 'Debes aceptar los términos y condiciones para continuar');
      setIsLoading(false);
      return;
    }
    
    console.log('Datos de registro:', userData);
    
    try {
      const api = axios.create({
        baseURL: 'http://192.168.0.161:3000/api',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
      });
      
      // Configurar interceptor de respuesta
      api.interceptors.response.use(
        response => response,
        error => {
          console.error('Error en la petición:', error);
          return Promise.reject(error);
        }
      );
      
      // Hacer la llamada al endpoint de registro
      const response = await api.post('/register-business', userData);
      
      console.log('Respuesta del servidor:', response.data);
      
      // Verificar si la respuesta es exitosa (200-299) y tiene datos
      if (response.status >= 200 && response.status < 300 && response.data) {
        console.log('Registro exitoso, navegando a verificación de código');
        
        // Guardar el token de autenticación si viene en la respuesta
        if (response.data.token) {
          // Aquí deberías guardar el token en tu sistema de autenticación
          // Por ejemplo: await AsyncStorage.setItem('userToken', response.data.token);
          console.log('Token de autenticación recibido');
        }
        
        // Derivar userId si el backend lo retornó
        const userIdParam = response?.data?.user?.id ?? response?.data?.userId ?? response?.data?.userid ?? undefined;
        
        // Navegar a la pantalla de configuración del negocio
        navigation.reset({
          index: 0,
          routes: [{
            name: 'BusinessConfig',
            params: {
              businessId: response.data.business?.id,
              email: userData.correo,
              phone: userData.numero,
              userId: userIdParam,
            }
          }]
        });
        
        return; // Importante: salir de la función después de la navegación
      } else {
        throw new Error(response.data?.message || 'Error en el registro');
      }

    } catch (error: any) {
      console.error('Error en el registro:', error);
      console.error('Detalles del error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Handle specific error cases if needed
      let errorMessage = 'Ocurrió un error al registrar tu cuenta. Por favor, inténtalo de nuevo.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Mensajes de error más específicos basados en la respuesta del servidor
        if (error.response.status === 400) {
          if (error.response.data?.error?.includes('contraseña')) {
            errorMessage = error.response.data.error;
          } else if (error.response.data?.error?.includes('existentes')) {
            // Si el error es por credenciales existentes, ofrecer ir a login
            Alert.alert(
              'Cuenta existente',
              'Ya existe una cuenta con este correo electrónico. ¿Te gustaría ir a la pantalla de inicio de sesión?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Ir a inicio de sesión',
                  onPress: () => navigation.navigate('Login'),
                },
              ]
            );
            return; // Salir temprano para no mostrar otro alert
          } else if (error.response.data?.error) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = 'Datos de registro inválidos. Por favor verifica la información.';
          }
        } else if (error.response.status === 409) {
          errorMessage = 'El correo electrónico ya está registrado. Por favor inicia sesión o usa otro correo.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No se recibió respuesta del servidor:', error.request);
        errorMessage = 'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.';
      }
      
      console.log('Mensaje de error mostrado al usuario:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      
      
        
        <Text style={styles.subtitle}>Completa el formulario para registrarte</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Teléfono"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <PasswordToggleIcon
            isVisible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#999"
          />
          <PasswordToggleIcon
            isVisible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </View>
        
         <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            {acceptTerms ? (
              <Ionicons name="checkbox" size={24} color="#4CAF50" />
            ) : (
              <Ionicons name="square-outline" size={24} color="#666" />
            )}
          </TouchableOpacity>
           <Text style={styles.termsText}>
            Aceptación de la{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => setShowPolicyModal(true)}
            >
              política de tratamiento de datos
            </Text>
          </Text> 
        </View>

        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>SIGUIENTE</Text>
          )}
        </TouchableOpacity>
       </ScrollView>
     </KeyboardAvoidingView>

      {/* Modal de Políticas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPolicyModal}
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Política de Tratamiento de Datos</Text>
              <Pressable onPress={() => setShowPolicyModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View>
                <Text style={styles.policyText}>
                En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, le informamos que sus datos personales serán tratados por PLANIA con las siguientes finalidades:
                
                {'\n\n'}1. Gestionar su registro como usuario de la plataforma.
                
                {'\n\n'}2. Mantener contacto con usted para informarle sobre novedades, actualizaciones y mejoras en los servicios.
                
                {'\n\n'}3. Realizar estudios estadísticos que nos permitan mejorar nuestros servicios.
                
                {'\n\n'}4. Cumplir con obligaciones legales y regulatorias aplicables.
                
                {'\n\n'}Sus datos serán tratados con las más estrictas medidas de seguridad y podrán ser compartidos únicamente cuando sea necesario para el cumplimiento de las finalidades descritas o por requerimiento de autoridad competente.
                
                {'\n\n'}Usted tiene derecho a conocer, actualizar, rectificar y suprimir su información personal, así como a revocar el consentimiento otorgado para el tratamiento de sus datos. Para ejercer estos derechos, puede contactarnos a través de los canales de atención al cliente dispuestos en nuestra plataforma.
                
                {'\n\n'}El tratamiento de sus datos personales se realizará por el tiempo necesario para cumplir con las finalidades descritas y las obligaciones legales aplicables.
                
                {'\n\n'}Para mayor información sobre nuestra política de tratamiento de datos personales, puede consultar nuestro documento completo en [enlace a la política completa].
                </Text>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowPolicyModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 15,  // Añadido espaciado superior
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
  headerSpacer: {
    // Eliminado ya que ahora usamos position: absolute para el botón de volver
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  modalFooter: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',  // Cambiado de absolute a relative
    marginTop: 10,         // Margen superior fijo
    flexDirection: 'row',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 14,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  termsLink: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 80,
  },
  nextButton: {
    backgroundColor: '#10b981',
    borderRadius: 18,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 190,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 300,
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
