
// IP de tu servidor de desarrollo - CAMBIAR ESTO A TU IP REAL
const SERVER_IP = '192.168.1.10';
const SERVER_PORT = 3000;

// Para clientes web (React)
export const getSocketConfig = () => {
  return {
    url: `http://${SERVER_IP}:${SERVER_PORT}`,
    options: {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io',
    },
  };
};

export const getExpoSocketConfig = () => {
  return {
    url: `http://${SERVER_IP}:${SERVER_PORT}`,
    options: {
      transports: ['websocket'], // Solo usar websocket en Expo
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io',
    },
  };
};

// Utilidades para obtener solo partes de la configuración
export const getServerUrl = () => getSocketConfig().url;
export const getSocketOptions = () => getSocketConfig().options;
export const getExpoServerUrl = () => getExpoSocketConfig().url;
