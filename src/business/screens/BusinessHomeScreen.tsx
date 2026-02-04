import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import SlidingFooter from '../../ui/SlidingFooter';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthContext } from '../../auth/context/AuthContext';

const API_BASE = 'http://192.168.0.161:3000';

type BHRoute = RouteProp<AuthStackParamList, 'BusinessHome'>;

interface Appointment {
  id: number;
  staffId: string;
  staffname: string;
  serviceType: string;
  horario: string;
  calificacion: number;
  date: string; // dd/mm/yyyy
}

const BusinessHomeScreen: React.FC = () => {
  const route = useRoute<BHRoute>();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();

  const businessId = useMemo(() => {
    return route.params?.businessId ?? user?.businessId ?? null;
  }, [route.params?.businessId, user?.businessId]);

  const [bizName, setBizName] = useState<string>(
    route.params?.businessName ?? 'Nombre del negocio'
  );
  const [bizAvatar, setBizAvatar] = useState<string>(
    route.params?.avatarUrl ?? ''
  );

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId) return;
      try {
        const url = `${API_BASE}/api/get-business/${businessId}`;
        const resp = await axios.get(url, { timeout: 15000 });
        const b =
          resp?.data?.business ??
          resp?.data?.data?.business ??
          resp?.data?.data ??
          resp?.data;
        if (b && typeof b === 'object') {
          const name = b.name ?? b.businessName ?? b.nombre ?? '';
          const avatar = b.avatarUrl ?? b.avatar ?? b.logoUrl ?? '';
          if (name) setBizName(String(name));
          if (avatar) setBizAvatar(String(avatar));
        }
      } catch (e) {
        console.log('Error fetching business', e);
      }
    };
    fetchBusiness();
  }, [businessId]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!businessId) return;
      setLoading(true);
      try {
        const url = `${API_BASE}/api/appointments/${businessId}`;
        const resp = await axios.get(url, { timeout: 15000 });
        const data = Array.isArray(resp?.data?.appointments)
          ? resp.data.appointments
          : [];
        setAppointments(data);
      } catch (e) {
        console.log('Error fetching appointments', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [businessId]);

  const first = appointments[0];
  const nextList = appointments.slice(1);

  const MONTH_ABBR = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const parseAppointmentDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[\/\-]/); // soporta dd/mm/yyyy
    if (parts.length < 3) return null;
    const dd = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (Number.isNaN(dd) || Number.isNaN(mm)) return null;
    const monthAbbr = MONTH_ABBR[Math.max(0, Math.min(11, mm - 1))];
    return { day: dd, monthAbbr };
  };

  const todayDate = new Date();
  const fallbackInfo = {
    day: todayDate.getDate(),
    monthAbbr: MONTH_ABBR[todayDate.getMonth()],
  };
  const calendarInfo = parseAppointmentDate(first?.date) ?? fallbackInfo;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#10b981" />
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <Ionicons name="calendar" size={22} color="#10b981" />
          <Text style={styles.logoText}>Plania</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Business info */}
      <View style={styles.bizRow}>
        <Text style={styles.bizName}>{bizName}</Text>
        {bizAvatar ? (
          <Image source={{ uri: bizAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="color-wand" size={28} color="#10b981" />
          </View>
        )}
      </View>

      {/* Today block */}
      <View style={styles.todayRow}>
        <View style={styles.calendarBox}>
          <Text style={styles.calendarDay}>
            {`${calendarInfo.day} ${calendarInfo.monthAbbr}`}
          </Text>
        </View>

        <View style={styles.todayInfo}>
          {loading ? (
            <Text style={styles.muted}>Cargando citas...</Text>
          ) : first ? (
            <>
              <Text style={styles.clientName}>{first.staffname}</Text>
              <Text style={styles.clientMeta}>{first.serviceType}</Text>
            </>
          ) : (
            <Text style={styles.muted}>
              No tienes agendamientos por el momento
            </Text>
          )}
        </View>

        <View style={styles.timeBox}>
          {first ? <Text style={styles.timeText}>{first.horario}</Text> : null}
        </View>
      </View>

      {/* Next appointments */}
      <Text style={styles.sectionTitle}>SIGUIENTES CITAS</Text>
      <FlatList
        data={nextList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={styles.appointmentItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.appointmentName}>{item.staffname}</Text>
              <Text style={styles.appointmentMeta}>{item.serviceType}</Text>
            </View>
            <Text style={styles.appointmentTime}>{item.horario}</Text>
          </View>
        )}
        ListEmptyComponent={null}
        ListFooterComponent={
          !loading && nextList.length < 5 ? (
            <View style={styles.noMoreWrap}>
              <Text style={styles.noMoreText}>
                No tienes más agendamientos{'\n'}de citas por el momento
              </Text>
              <TouchableOpacity
                style={styles.ctaCard}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert('Añadir cita', 'Abrir flujo de agendamiento')
                }
              >
                <View style={styles.iconWrap}>
                  <MaterialIcons name="calendar-today" size={44} color="#f97316" />
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusBadgeText}>+</Text>
                  </View>
                </View>
                <Text style={styles.ctaButtonText}>Añadir cita</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* 🔹 Footer curvado */}
      <SlidingFooter
        items={[
          { key: 'clients', label: 'Tus clientes', icon: 'people-outline', onPress: () => Alert.alert('Clientes') },
          { key: 'appointments', label: 'Mis Citas', icon: 'calendar-outline', onPress: () => Alert.alert('Citas') },
          { key: 'rating', label: '5.0', icon: 'star-outline', onPress: () => Alert.alert('Valoración') },
        ]}
        collapsedHeight={78}
        expandedHeight={160}
        bottomOffset={2}
        bottomInset={Platform.OS === 'android' ? Math.max(insets.bottom, 28) : Math.max(insets.bottom, 20)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: { marginLeft: 6, fontSize: 16, color: '#10b981', fontWeight: '700' },
  bizRow: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bizName: { fontSize: 24, fontStyle: 'italic', color: '#222' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  todayRow: {
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#eafff5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calendarDay: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  todayInfo: { flex: 1 },
  clientName: { fontSize: 18, color: '#111' },
  clientMeta: { fontSize: 13, color: '#555', marginTop: 2 },
  timeBox: { paddingLeft: 8 },
  timeText: { fontSize: 16, color: '#111' },
  muted: { fontSize: 14, color: '#777' },
  sectionTitle: {
    marginTop: 18,
    paddingHorizontal: 16,
    fontSize: 14,
    letterSpacing: 1,
    color: '#666',
  },
  appointmentItem: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentName: { fontSize: 15, color: '#222' },
  appointmentMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  appointmentTime: { fontSize: 14, color: '#111' },
  noMoreWrap: { alignItems: 'center', paddingVertical: 20, marginTop: 8 },
  noMoreText: {
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ctaCard: {
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    width: '50%',
    alignSelf: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  plusBadgeText: { color: '#fff', fontSize: 16, lineHeight: 16, fontWeight: '700' },
  ctaButtonText: { marginTop: 6, color: '#111', fontSize: 18, fontWeight: '400' },
});

export default BusinessHomeScreen;
