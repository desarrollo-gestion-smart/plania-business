import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList, StaffSetupItem } from '../../navigation/AuthNavigator';
import axios from 'axios';

// Tipos de navegación
type StaffSetupRouteProp = RouteProp<AuthStackParamList, 'StaffSetup'>;

type StaffSetupNavigationProp = StackNavigationProp<AuthStackParamList>;

const API_BASE = 'http://192.168.0.161:3000';

const StaffSetupScreen: React.FC = () => {
  const route = useRoute<StaffSetupRouteProp>();
  const navigation = useNavigation<StaffSetupNavigationProp>();
  const staffParam = useMemo<StaffSetupItem[]>(() => route.params?.staff ?? [], [route.params]);

  const [index, setIndex] = useState(0);
  const initialNames = staffParam.map((s) => {
    const n = (s?.nombre || '').trim();
    return n || '';
  });
  const initialSurnames = staffParam.map((s) => {
    const a = (s?.apellido || '').trim();
    if (a) return a;
    // fallback: si solo viene nombre completo en `nombre`, partirlo
    const full = (s?.nombre || '').trim();
    const parts = full.split(' ').filter(Boolean);
    return parts.slice(1).join(' ');
  });
  const [names, setNames] = useState<string[]>(initialNames);
  const [surnames, setSurnames] = useState<string[]>(initialSurnames);
  const [phones, setPhones] = useState<string[]>(staffParam.map(s => (s?.numero || '').trim()));
  const [passwords, setPasswords] = useState<string[]>(staffParam.map(s => (s?.password || '').trim()));
  const [fetchedStaffIds, setFetchedStaffIds] = useState<string[]>([]);

  const isLast = index === staffParam.length - 1;
  const currentAvatar = staffParam[index]?.avatar;

  // Fetch de IDs de staff para vinculación
  useEffect(() => {
    const idParamRaw = route.params?.businessId;
    const idParam = Number(idParamRaw);
    if (!idParam || Number.isNaN(idParam)) {
      console.warn('get-staff-ids: businessId inválido', idParamRaw);
      return;
    }
    const url = `${API_BASE}/api/get-staff-ids/${idParam}`;
    axios
      .get(url, { timeout: 15000 })
      .then((resp) => {
        console.log('GET get-staff-ids success:', resp.status);
        console.log('GET get-staff-ids data:', resp.data);
        const ids = Array.isArray(resp?.data?.staffIds) ? resp.data.staffIds : [];
        if (ids.length) {
          setFetchedStaffIds(ids.map(String));
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.log('GET get-staff-ids error:', { status, data, message: err?.message });
      });
  }, [route.params?.businessId]);

  const sendStaffUpdate = async (): Promise<boolean> => {
    try {
      const idParamRaw = route.params?.businessId;
      const idParam = Number(idParamRaw);
      if (!idParam || Number.isNaN(idParam)) {
        Alert.alert('Falta id', 'No viene businessId válido en parámetros');
        return false;
      }

      // Enviar SOLO el profesional actual; NO sobreescribir avatar
      const s = staffParam[index];
      const effectiveId = fetchedStaffIds[index] ?? String(s?.id ?? '');
      if (!effectiveId) {
        Alert.alert('Falta id de staff', 'No se pudo resolver el id del profesional.');
        return false;
      }

      const nombre = (names[index] || '').trim();
      const apellido = (surnames[index] || '').trim();
      const telefono = (phones[index] || '').trim();
      const password = (passwords[index] || '').trim();

      if (!password) {
        Alert.alert('Falta la contraseña', 'La contraseña es obligatoria.');
        return false;
      }

      const body: any = { id: effectiveId, password };
      if (nombre) body.nombre = nombre;
      if (apellido) body.apellido = apellido;
      if (telefono) body.telefono = telefono; // usar "telefono" según especificación

      const url = `${API_BASE}/api/update-staff`;
      const headers = { 'Content-Type': 'application/json' };
      const resp = await axios.put(url, body, { headers, timeout: 15000 });
      if (resp.status >= 200 && resp.status < 300) {
        return true;
      }
      Alert.alert('Error', `HTTP ${resp.status}`);
      return false;
    } catch (e: any) {
      Alert.alert('Error al guardar', e?.message || 'Error desconocido');
      return false;
    }
  };

  const goNext = async () => {
    if (!names[index]?.trim()) {
      Alert.alert('Falta el nombre', 'Por favor ingresa el nombre.');
      return;
    }
    if (!surnames[index]?.trim()) {
      Alert.alert('Falta el apellido', 'Por favor ingresa el apellido.');
      return;
    }
    if (!phones[index]?.trim()) {
      Alert.alert('Falta el teléfono', 'Por favor ingresa el número.');
      return;
    }
    if (!passwords[index]?.trim()) {
      Alert.alert('Falta la contraseña', 'Por favor ingresa la contraseña.');
      return;
    }

    const ok = await sendStaffUpdate();
    if (!ok) return;

    if (isLast) {
      // Al finalizar y con status 200, ir al Home del negocio con businessId
      const idParamRaw = route.params?.businessId;
      navigation.reset({ index: 0, routes: [{ name: 'BusinessHome', params: { businessId: idParamRaw } }] });
      return;
    }
    setIndex(i => i + 1);
  };

  const goBack = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Ionicons name="calendar" size={40} color="#10b981" />
          <Text style={styles.title}>PLANIA</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepTitle}>Configurar profesional {index + 1} de {staffParam.length}</Text>

        <View style={styles.avatarContainer}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={56} color="#FFA500" />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={names[index]}
            onChangeText={(t) => setNames(prev => {
              const next = [...prev];
              next[index] = t;
              return next;
            })}
            placeholder="Ingresa el nombre"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={surnames[index]}
            onChangeText={(t) => setSurnames(prev => {
              const next = [...prev];
              next[index] = t;
              return next;
            })}
            placeholder="Ingresa el apellido"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={phones[index]}
            keyboardType="phone-pad"
            onChangeText={(t) => setPhones(prev => {
              const next = [...prev];
              next[index] = t;
              return next;
            })}
            placeholder="Ingresa el teléfono"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={passwords[index]}
            secureTextEntry
            onChangeText={(t) => setPasswords(prev => {
              const next = [...prev];
              next[index] = t;
              return next;
            })}
            placeholder="Ingresa la contraseña"
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>{isLast ? 'Finalizar' : 'Siguiente'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 10,
    position: 'relative',
  },
  backButton: { padding: 10, position: 'absolute', left: 20, top: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginLeft: 4 },
  content: { padding: 20, alignItems: 'center' },
  stepTitle: { fontSize: 18, fontStyle: 'italic', color: '#333', marginVertical: 10 },
  avatarContainer: { alignItems: 'center', marginVertical: 10 },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  inputGroup: { width: '100%', marginTop: 14 },
  label: { fontSize: 16, marginBottom: 8, color: '#333', fontWeight: '500', textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 12 },
  generateButton: { height: 48, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  generateButtonText: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 130 },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButtonText: { color: '#10b981', fontWeight: '600' },
  primaryButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});

export default StaffSetupScreen;