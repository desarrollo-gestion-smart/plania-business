import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditIconProps {
  onPress?: () => void;
  style?: any;
  iconSize?: number;
  iconColor?: string;
  position?: 'overlay' | 'inline' | 'inlineAbsolute';
}

const EditIcon: React.FC<EditIconProps> = ({
  onPress,
  style,
  iconSize = 20,
  iconColor = '#8B5CF6',
  position = 'overlay',
}) => {
  let containerStyle = [styles.editIconContainer, style];
  if (position === 'inline') {
    containerStyle = [styles.editIconContainerInline, style];
  } else if (position === 'inlineAbsolute') {
    containerStyle = [styles.editIconContainerInlineAbsolute, style];
  }

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress}>
        <Ionicons name="pencil" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <Ionicons name="pencil" size={iconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  editIconContainer: {
    position: 'absolute',
    bottom: -10,
    right: 80,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editIconContainerInline: {
    marginLeft: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editIconContainerInlineAbsolute: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -15,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default EditIcon;