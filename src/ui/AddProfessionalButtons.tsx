import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface AddProfessionalButtonsProps {
  onImageSelected: (uri: string, slotIndex: number) => void;
}

const AddProfessionalButtons: React.FC<AddProfessionalButtonsProps> = ({
  onImageSelected,
}) => {
  const [slotImages, setSlotImages] = useState<(string | null)[]>([null, null]);

  const handlePress = async (slotIndex: number) => {
    console.log('AddProfessionalButtons handlePress called for slot', slotIndex);
    // Request permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    console.log('Camera permission:', cameraPermission.status);
    console.log('Media permission:', mediaPermission.status);

    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a la cámara y galería.');
      return;
    }

    // Show options
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo quieres agregar la imagen del profesional?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: async () => {
            console.log('Launching camera for slot', slotIndex);
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            console.log('Camera result:', result);
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setSlotImages(prev => {
                const next = [...prev];
                next[slotIndex] = uri;
                return next;
              });
              onImageSelected(uri, slotIndex);
            }
          },
        },
        {
          text: 'Seleccionar de galería',
          onPress: async () => {
            console.log('Launching image library for slot', slotIndex);
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            console.log('Library result:', result);
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setSlotImages(prev => {
                const next = [...prev];
                next[slotIndex] = uri;
                return next;
              });
              onImageSelected(uri, slotIndex);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {slotImages[0] ? (
        <TouchableOpacity style={styles.button} onPress={() => handlePress(0)}>
          <Image source={{ uri: slotImages[0] }} style={styles.proImage} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => handlePress(0)}>
          <Ionicons name="add" size={24} color="#FFA500" />
        </TouchableOpacity>
      )}
      {slotImages[1] ? (
        <TouchableOpacity style={styles.button} onPress={() => handlePress(1)}>
          <Image source={{ uri: slotImages[1] }} style={styles.proImage} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => handlePress(1)}>
          <Ionicons name="add" size={24} color="#FFA500" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
    gap: 20,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    overflow: 'hidden',
  },
  proImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
});

export default AddProfessionalButtons;