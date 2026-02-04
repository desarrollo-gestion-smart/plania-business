import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ViewStyle, TextStyle } from 'react-native';

interface FooterItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

interface SlidingFooterProps {
  items: FooterItem[];
  collapsedHeight?: number; // altura del asa (dos líneas)
  expandedHeight?: number;  // altura cuando se muestra el menú
  bottomOffset?: number;    // separación desde el borde inferior (posición)
  bottomInset?: number;     // padding interno inferior (safe area)
}

const SlidingFooter: React.FC<SlidingFooterProps> = ({
  items,
  collapsedHeight = 36,
  expandedHeight = 160,
  bottomOffset = 0,
  bottomInset = 0,
}) => {
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const startHeightRef = useRef(collapsedHeight);

  useEffect(() => {
    heightAnim.setValue(collapsedHeight);
    startHeightRef.current = collapsedHeight;
  }, [collapsedHeight, heightAnim]);

  const toExpanded = () => {
    Animated.spring(heightAnim, {
      toValue: expandedHeight,
      useNativeDriver: false,
      bounciness: 6,
    }).start(() => {
      startHeightRef.current = expandedHeight;
    });
  };

  const toCollapsed = () => {
    Animated.spring(heightAnim, {
      toValue: collapsedHeight,
      useNativeDriver: false,
      bounciness: 6,
    }).start(() => {
      startHeightRef.current = collapsedHeight;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        const current = (heightAnim as any)._value ?? collapsedHeight;
        startHeightRef.current = current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = startHeightRef.current - gesture.dy;
        const clamped = Math.max(collapsedHeight, Math.min(expandedHeight, next));
        heightAnim.setValue(clamped);
      },
      onPanResponderRelease: () => {
        const threshold = (collapsedHeight + expandedHeight) / 2;
        const current = (heightAnim as any)._value ?? collapsedHeight;
        if (current > threshold) toExpanded();
        else toCollapsed();
      },
    })
  ).current;

  const toggle = () => {
    const current = (heightAnim as any)._value ?? collapsedHeight;
    if (current > collapsedHeight + 8) toCollapsed();
    else toExpanded();
  };

  return (
    <Animated.View
      style={[styles.container, { height: heightAnim, bottom: bottomOffset, paddingBottom: bottomInset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabCurve} />
      {/* Notch centrado */}
      <TouchableWithoutFeedback onPress={toggle}>
        <View style={styles.notchContainer} {...panResponder.panHandlers}>
          <View style={styles.notch} />
          <View style={styles.handleLine} />
          <View style={styles.handleLineShort} />
        </View>
      </TouchableWithoutFeedback>

      {/* Contenido del menú */}
      <View style={styles.content}>
        {items.map((item) => (
          <TouchableOpacity key={item.key} style={styles.item} activeOpacity={0.8} onPress={item.onPress}>
            <Ionicons name={item.icon} size={32} color="#f97316" />
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  tabCurve: ViewStyle;
  notchContainer: ViewStyle;
  notch: ViewStyle;
  handleWrap: ViewStyle;
  handleLine: ViewStyle;
  handleLineShort: ViewStyle;
  content: ViewStyle;
  item: ViewStyle;
  itemLabel: TextStyle;
}>({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    zIndex: 9999,
    elevation: 8,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tabCurve: {
    position: 'absolute',
    top: -48,
    alignSelf: 'center',
    width: '80%',
    height: 72,
    backgroundColor: '#ffffff',
    borderRadius: 72,
    zIndex: 1,
  },

  /* 🔹 Curva superior (notch central) */
  notchContainer: {
    position: 'absolute',
    top: -24,
    left: '50%',
    transform: [{ translateX: -40 }],
    width: 80,
    height: 40,
    overflow: 'hidden',
    alignItems: 'center',
    zIndex: 3,
  },
  notch: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    top: -40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  handleLine: {
    position: 'absolute',
    top: 6,
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    zIndex: 4,
  },
  handleLineShort: {
    position: 'absolute',
    top: 14,
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    zIndex: 4,
  },

  handleWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },

  /* Contenido del menú */
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
});

export default SlidingFooter;
