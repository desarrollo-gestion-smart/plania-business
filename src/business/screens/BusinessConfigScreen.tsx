import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthContext } from '../../auth/context/AuthContext';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EditIcon from '../../ui/EditIcon';
import AddProfessionalButtons from '../../ui/AddProfessionalButtons';

// Definir el tipo para los parámetros de la ruta
interface BusinessConfigParams {
  businessId: string;
  email?: string;
  phone?: string;
  userId?: string | number;
}



type BusinessConfigRouteProp = RouteProp<{ BusinessConfig: BusinessConfigParams }, 'BusinessConfig'>;

const BusinessConfigScreen = () => {

  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const route = useRoute<BusinessConfigRouteProp>();
  const { user } = useAuthContext();
  // Obtener los parámetros de la ruta con valores por defecto
  const params = route.params || {} as BusinessConfigParams;
  const { businessId, email = '', phone = '', userId } = params;
  // console.log("parametros", params)

  // console.log("businessId", params.businessId)
  
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [employeeCount, setEmployeeCount] = useState(1);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  // Añadir metadatos de archivo para multipart
  
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);
  
  // Punto común de API (ajusta si usas localhost)
  const API_BASE = 'http://192.168.0.161:3000' ;
  
  // Subir imagen y devolver URL pública
  const uploadImage = async (uri: string, id?: number): Promise<string> => {
    try {
      const formData = new FormData();
      const lower = uri.toLowerCase();
      const ext = lower.endsWith('.png') ? 'png' : 'jpg';
      const type = ext === 'png' ? 'image/png' : 'image/jpeg';
      const name = `image.${ext}`;
      formData.append('image', { uri, type, name } as any);
      if (id && Number.isFinite(id)) {
        const idStr = String(id);
        formData.append('id', idStr);
        formData.append('businessId', idStr);
      }
  
      const uploadUrl = `${API_BASE}/api/upload-business-avatar`;
      console.log('uploadImage POST ->', { url: uploadUrl, headers: { 'Content-Type': 'multipart/form-data' }, id, businessId: id });
      const response = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
      });
  
      const url = response.data?.url ?? response.data?.location ?? response.data?.secure_url ?? '';
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        return url;
      }
      throw new Error('Respuesta de upload inválida');
    } catch (e: any) {
      const sentData = e?.config?.data;
      const sentHeaders = e?.config?.headers;
      console.log('uploadImage error: ', { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      console.log('uploadImage sent body (from axios error.config):', typeof sentData === 'string' ? sentData : JSON.stringify(sentData, null, 2));
      console.log('uploadImage sent headers (from axios error.config):', sentHeaders);
      throw e;
    }
  };

  const incrementEmployees = () => {
    setEmployeeCount(prev => Math.min(prev + 1, 100)); // Límite de 100 empleados
  };

  const decrementEmployees = () => {
    setEmployeeCount(prev => Math.max(prev - 1, 1)); // Mínimo 1 empleado
  };

  const handleBannerPress = async () => {
    // Request permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a la cámara y galería.');
      return;
    }
  
    // Show options
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo quieres agregar la imagen del banner?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.3,
              });
              if (!result.canceled) {
                const asset = result.assets[0];
                setBannerUri(asset.uri);
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo abrir la cámara. Verifica permisos.');
            }
          },
        },
        {
          text: 'Seleccionar de galería',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.3,
              });
              if (!result.canceled) {
                const asset = result.assets[0];
                setBannerUri(asset.uri);
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo abrir la galería. Verifica permisos.');
            }
          },
        },
      ]
    );
  };

  const [professionalAvatars, setProfessionalAvatars] = useState<(string | null)[]>([null, null]);

  const handleProfessionalImageSelected = (uri: string, slotIndex: number) => {
    // Persistir la imagen seleccionada por slot para enviar en staff
    setProfessionalAvatars(prev => {
      const next = [...prev];
      next[slotIndex] = uri;
      return next;
    });
  };

  const handleLogoPress = async () => {
    // Request permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a la cámara y galería.');
      return;
    }
  
    // Show options
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo quieres agregar la imagen del logo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
              });
              if (!result.canceled) {
                const asset = result.assets[0];
                setLogoUri(asset.uri);
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo abrir la cámara. Verifica permisos.');
            }
          },
        },
        {
          text: 'Seleccionar de galería',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
              });
              if (!result.canceled) {
                const asset = result.assets[0];
                setLogoUri(asset.uri);
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo abrir la galería. Verifica permisos.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {

    try {
      setIsLoading(true);
      console.log('handleSave: iniciando envío a configure-business');

      // Si hay logo/banner, obtener URL: usar directamente si es http(s) o subir si es local
      // Preparar avatarUrl y bannerUrl; se resolverán después de obtener id
      let avatarUrl: string = '';
      let bannerUrl: string = '';

      // Validar y resolver id desde params (businessId)
      const idParamRaw = params?.businessId;
      const idParam = Number(idParamRaw);
      if (!idParam || Number.isNaN(idParam)) {
        console.log('configure-business abort: id inválido', {
          businessId: params?.businessId,
          userId: params?.userId,
          idParamRaw,
        });
        Alert.alert('Falta id', 'No viene businessId válido en parámetros');
        setIsLoading(false);
        return;
      }

      // Resolver userId: usar params.userId o fallback a businessId
      const userIdParamRaw = params?.userId ?? params?.businessId;
      const userIdParam = Number(userIdParamRaw);
      if (!userIdParam || Number.isNaN(userIdParam)) {
        console.log('configure-business abort: userId inválido', {
          businessId: params?.businessId,
          userId: params?.userId,
          userIdParamRaw,
        });
        Alert.alert('Falta userId', 'No viene userId válido en parámetros');
        setIsLoading(false);
        return;
      }

      console.log('configure-business params & resolved ids', {
        routeParams: { businessId: params?.businessId, userId: params?.userId },
        resolved: { id: idParam, userId: userIdParam }
      });

      // Resolver avatarUrl y bannerUrl ahora que tenemos idParam
      avatarUrl = logoUri
        ? (/^https?:\/\//.test(logoUri) ? logoUri : await uploadImage(logoUri, idParam))
        : '';
      bannerUrl = bannerUri
        ? (/^https?:\/\//.test(bannerUri) ? bannerUri : await uploadImage(bannerUri, idParam))
        : '';
      console.log('bannerUrl resolved:', bannerUrl);

      // Resolver staff avatars desde los slots seleccionados
      const staffFromAvatars: { nombre: string; numero: string; password: string; avatar: string }[] = [];
      for (const slotUri of professionalAvatars) {
        if (slotUri) {
          const isLocalStaffAvatar = !/^https?:\/\//.test(slotUri);
          const staffAvatarUrl = isLocalStaffAvatar ? await uploadImage(slotUri, idParam) : slotUri;
          staffFromAvatars.push({ nombre: '', numero: '', password: '', avatar: staffAvatarUrl });
        }
      }

      // Construir JSON con id, name y description; resto vacío
      const businessData = {
        id: idParam,
        businessId: String(idParam), // alias por compatibilidad
        name: businessName.trim(),
        description: description.trim(),
        avatarUrl: avatarUrl,
        bannerUrl: bannerUrl,
        staff: staffFromAvatars.length ? staffFromAvatars : []
      };

      console.log('configure-business payload fields:', {
        id: businessData.id,
        businessId: businessData.businessId,
        name: businessData.name,
        description: businessData.description,
        avatarUrl: businessData.avatarUrl,
        bannerUrl: businessData.bannerUrl,
        staff: businessData.staff,
      });
      console.log('configure-business id types:', { idType: typeof businessData.id });
      console.table(businessData);

      const url = `${API_BASE}/api/configure-business`;
      const headers = { 'Content-Type': 'application/json' };
      // console.log('configure-business POST ->', { url, headers });
      // console.log('configure-business body:', JSON.stringify(businessData, null, 2));
      // Alert.alert('configure-business body', JSON.stringify(businessData));

      // Enviar el objeto JSON directamente para asegurar el parseo en backend
      const response = await axios.post(url, businessData, { headers, timeout: 15000 });
      console.log('configure-business success:', { status: response.status, data: response.data });
  
      if (response.status === 200) {
        // Intentar obtener el staff con IDs desde la respuesta del backend
        const respStaff = (response.data?.staff || response.data?.business?.staff || response.data?.data?.staff || []) as Array<any>;

        // Construir staff para StaffSetup SOLO si tenemos IDs reales
        let staffForSetup: Array<{ id: number; avatar: string; nombre: string; apellido: string; numero: string; password: string }> = [];
        if (Array.isArray(respStaff) && respStaff.length) {
          staffForSetup = respStaff
            .map((s: any) => {
              const idVal = s?.id ?? s?._id;
              if (idVal === undefined || idVal === null) return null;
              const idNum = Number(idVal);
              if (!idNum || Number.isNaN(idNum)) return null;
              const avatar = s?.avatar ?? s?.avatarUrl ?? '';
              if (!avatar) return null;
              return {
                id: idNum,
                avatar,
                nombre: s?.nombre ?? '',
                apellido: s?.apellido ?? '',
                numero: s?.numero ?? '',
                password: s?.password ?? '',
              };
            })
            .filter(Boolean) as any[];
        }

        if (staffForSetup.length > 0) {
          // Navegar a StaffSetup con IDs válidos
          console.log('Navegando a StaffSetup con staff:', staffForSetup.length);
          navigation.navigate('StaffSetup', { staff: staffForSetup, businessId: idParam });
        } else {
          // Si no hay staff o no se recibieron IDs, redirigir a Home
          console.log('No hay staff válido, navegando a BusinessHome');
          navigation.navigate('BusinessHome', { businessId: idParam });
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const message = error?.message;
      const sentData = error?.config?.data;
      const sentHeaders = error?.config?.headers;
      const errorUrl = error?.config?.url;
      const method = error?.config?.method;
      console.log('request failed:', { url: errorUrl, method });
      console.log(
        'failed request body (from axios error.config):',
        typeof sentData === 'string' ? sentData : JSON.stringify(sentData, null, 2)
      );
      console.log('failed request headers (from axios error.config):', sentHeaders);
      console.log('request error:', { status, data, message });
      Alert.alert('Error al configurar', status ? `HTTP ${status}` : (message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Ionicons name="calendar" size={40} color="#10b981" />
          <Text style={styles.title}>PLANIA</Text>
        </View>
      </View>
      
      {/* Contenedor del banner */}

      {/* Etiqueta del avatar */}
      <Text style={styles.bannerLabel}>Elige tu avatar</Text>

      {/* Contenedor del logo */}
      <View style={styles.businessLogoContainer}>
        {logoUri ? (
          <>
            <TouchableOpacity onPress={handleLogoPress}>
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            </TouchableOpacity>
            <EditIcon onPress={handleLogoPress}  style={styles.editavatar}/>
          </>
        ) : (
          <TouchableOpacity style={styles.addLogoButton} onPress={handleLogoPress}>
            <Ionicons name="image" size={40} color="#FFA500" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sección del nombre del negocio */}
      <View style={styles.businessNameContainer}>
        <View style={styles.nameRow}>
          {isEditingName ? (
            <TextInput
              style={styles.businessNameInput}
              value={businessName}
              onChangeText={setBusinessName}
              onBlur={() => setIsEditingName(false)}
              autoFocus
              placeholder="Nombre del Negocio"
            />
          ) : (
            <Text style={styles.businessNameLabel}>{businessName || 'Nombre del Negocio'}</Text>
          )}
          <EditIcon
            position="inline"
            onPress={() => setIsEditingName(true)}
          />
        </View>
      </View>

      {/* Sección de descripción del negocio */}
      <View style={styles.descriptionContainer}>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe tu negocio"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Etiqueta del banner */}
      <Text style={styles.bannerLabel}>Elige tu banner</Text>

      {/* Contenedor del banner */}
      <View style={styles.businessLogoContainer}>
        {bannerUri ? (
          <>
            <TouchableOpacity onPress={handleBannerPress}>
              <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
            </TouchableOpacity>
            <EditIcon onPress={handleBannerPress} />
          </>
        ) : (
          <TouchableOpacity
            style={styles.addBannerButton}
            onPress={handleBannerPress}
          >
            <Ionicons name="image" size={40} color="#FFA500" />
          </TouchableOpacity>
        )}
      </View>

      {/* Agregar profesionales fuera del ScrollView */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Agregar profesionales</Text>
          <AddProfessionalButtons
            onImageSelected={handleProfessionalImageSelected}
          />
        </View>
         <View style={styles.formContainer}>

         

          <View style={styles.inputContainer}>
            {/* Otros inputs que necesites agregar aquí */}
          </View>
        </View>
      </View>

   
       

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={() => {
            handleSave();
          }}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Registrando...' : 'REGISTRARSE'}
          </Text>
        </TouchableOpacity>
      
      </SafeAreaView>

  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 4,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 25,
    marginLeft: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
    width: '90%',
  },
  saveButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
    marginTop: 20,
    backgroundColor:'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    width: '65%',
    minHeight: 80,
    maxWidth: 300,
    justifyContent: 'center',
    gap: 8,
  },
  bannerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bannerImage: {
    width: 200,
    height: 120,
    borderRadius: 10,
  },
  addBannerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessNameLabel: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#333',
  },
  businessNameInput: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#333',
  },
  descriptionContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  descriptionInput: {
    padding: 10,
    width: '80%',
    height: 100,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'white',
  },
  bannerLabel: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  businessLogoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  addLogoButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plusIconContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  editavatar:{
    marginRight: 80,
  }
});

export default BusinessConfigScreen;
