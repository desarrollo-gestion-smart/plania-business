import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Change this to false to show onboarding only once per install
const SHOW_ONBOARDING_ALWAYS = __DEV__ ? true : false;

export default function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0); // 👈 controla la pantalla actual
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const translateY = useSharedValue(0);

  // Check if onboarding should be skipped
  useEffect(() => {
    if (!SHOW_ONBOARDING_ALWAYS) {
      AsyncStorage.getItem('onboardingCompleted').then(value => {
        if (value === 'true') {
          onComplete?.();
        }
      }).catch(err => console.error('Error checking onboarding:', err));
    }
  }, [onComplete]);

  // Efecto para navegar cuando shouldNavigate cambia
  useEffect(() => {
    if (shouldNavigate) {
      AsyncStorage.setItem('onboardingCompleted', 'true').catch(err =>
        console.error('Error saving onboarding:', err)
      );
      onComplete?.();
    }
  }, [shouldNavigate, onComplete]);

  const swipeUp = Gesture.Pan()
    .onUpdate((event: PanGestureHandlerEventPayload) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event: PanGestureHandlerEventPayload) => {
      if (event.translationY < -100) {
        if (step < 3) {
          runOnJS(setStep)(step + 1);
        } else {
          runOnJS(setShouldNavigate)(true);
        }
      }
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      padding: 40,
    },
    title: {
      textAlign: "center",
      fontSize: 24,
      fontWeight: "500",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: "400",
      textAlign: "center",
    },
   
    swipeText: {
      marginLeft: 10,
      fontSize: 14,
      color: "#333",
    },
    grayTextTitle: {
      textAlign: "center",
      fontSize: 24,
      fontWeight: "500",
      marginBottom: 10,
      color: "#b6b6b6",
    },
    grayTextSubtitle: {
      fontSize: 20,
      fontWeight: "400",
      textAlign: "center",
      color: "#b6b6b6",
      marginBottom: 10, // Reducido para consistencia
    },
    controlText: {
      color: "#21a12c",
      fontSize: 20, // Ajustado para coincidir con subtitle
      fontWeight: "500",
    },
    businessText: {
      color: "#8311b1",
    },
  });

  const textoConSalto = "Te ayudaremos a gestionar\ntus finanzas";

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={swipeUp}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            {step === 0 ? (
              <>
                <Text style={styles.title}>Hola</Text>
                <Text style={styles.subtitle}>bienvenido a Plania</Text>
              </>
            ) : step === 1 ? (
              <>
                <Text style={styles.grayTextTitle}>Hola</Text>
                <Text style={styles.grayTextSubtitle}>bienvenido a Plania</Text>
                <Text style={styles.subtitle}>Te ayudaremos a simplificar tu agenda</Text>
              </>
            ) : step === 2 ? (
              <>
                <Text style={styles.grayTextSubtitle}>Te ayudaremos a simplificar tu agenda</Text>
                <Text style={styles.subtitle}>{textoConSalto}</Text>
              </>
            ) : step === 3 ? (
              <>
                <Text style={styles.grayTextSubtitle}>{textoConSalto}</Text>
                <Text style={styles.subtitle}>Perfecto para</Text>
                <Text style={styles.subtitle}>Llevar <Text style={styles.controlText}>control</Text> de tu <Text style={styles.businessText}> negocio </Text></Text>

              </>
            ) : (
              <>
              </>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={{ fontSize: 25, lineHeight: 20, marginBottom: -10}}>^</Text>
              <Text style={{ fontSize: 25, lineHeight: 20,marginBottom: -10 }}>^</Text>
              <Text style={{ fontSize: 25, lineHeight: 20,marginBottom: -10}}>^</Text>
            </View>
            <Text style={styles.swipeText}>Deslice para continuar</Text>
          </View>

        </Animated.View>
      </GestureDetector>
    </View>
  );
}