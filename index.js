/**
 * @format
 */

import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Disable react-native-screens as early as possible
enableScreens(false);

import App from './App';

registerRootComponent(App);
