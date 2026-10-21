import { registerRootComponent } from 'expo';

import App from './App';
import { registerTrackPlayerService } from './src/services/trackPlayerService';

// Register background playback service for iOS AVAudioSession, Lock Screen & AirPods
registerTrackPlayerService();

registerRootComponent(App);
