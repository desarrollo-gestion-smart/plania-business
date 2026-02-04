import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordToggleIconProps {
  isVisible: boolean;
  onToggle: () => void;
  size?: number;
  color?: string;
}

const PasswordToggleIcon: React.FC<PasswordToggleIconProps> = ({
  isVisible,
  onToggle,
  size = 20,
  color = '#666',
}) => {
  return (
    <TouchableOpacity
      style={{ padding: 10 }}
      onPress={onToggle}
    >
      <Ionicons
        name={isVisible ? 'eye-off-outline' : 'eye-outline'}
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
};

export default PasswordToggleIcon;