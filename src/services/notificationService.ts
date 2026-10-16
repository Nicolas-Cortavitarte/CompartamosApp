import notifee, { AndroidImportance } from '@notifee/react-native';
import Tts from 'react-native-tts';

// Configurar la voz en español
Tts.setDefaultLanguage('es-ES'); // o 'es-MX'
Tts.setDefaultRate(0.6); // Velocidad un poco más pausada (por defecto es 0.5 o 1.0)
Tts.setDefaultPitch(1.0); // Tono neutral y claro
export const triggerSmartVoiceNotification = async (
  title: string,
  body: string,
  voiceText: string,
) => {
  try {
    // 1. Pedir permisos de notificación (necesario en Android 13+)
    await notifee.requestPermission();

    // 2. Crear el Canal de Notificación para Android
    const channelId = await notifee.createChannel({
      id: 'finanzas_canal',
      name: 'Alertas de Finanzas',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    // 3. Mostrar la notificación flotante en la barra superior del celular
    await notifee.displayNotification({
      title: title,
      body: body,
      android: {
        channelId,
        smallIcon: 'ic_launcher', // Usa el ícono de la app
        pressAction: {
          id: 'default',
        },
      },
    });

    // 4. Reproducir el mensaje
    Tts.stop();
    Tts.speak(voiceText);
  } catch (error) {
    console.error('Error al enviar notificación con voz:', error);
  }
};
