class ConnectionDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.checkInterval = null;
    this.lastCheckTime = Date.now();
    this.lastStatusChange = Date.now();
    
    // Bind methods
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.checkConnection = this.checkConnection.bind(this);
    this.checkConnectionThrottled = this.checkConnectionThrottled.bind(this);
    
    // Inicializar
    this.init();
  }

  init() {
    // Eventos nativos del navegador
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Polling cada 10 segundos para detectar cambios que los eventos no capturan
    this.startPolling();
    
    // Verificar conexión al hacer foco en la ventana
    window.addEventListener('focus', this.checkConnection);
    
    // Verificar conexión al hacer click (para detectar cambios en DevTools)
    document.addEventListener('click', this.checkConnectionThrottled);
  }

  // Verificar conexión real al servidor
  async checkConnection() {
  if (!navigator.onLine) {
    if (this.isOnline) {
      this.isOnline = false;
      this.lastStatusChange = Date.now();
      this.notifyListeners('offline', false);
    }
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('http://localhost:8000/api/health', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    }).catch(() => null);

    clearTimeout(timeoutId);

    const wasOnline = this.isOnline;
    const isNowOnline = !!(response && response.ok);

    if (wasOnline !== isNowOnline) {
      this.isOnline = isNowOnline;
      this.lastStatusChange = Date.now();
      this.notifyListeners(isNowOnline ? 'online' : 'offline', isNowOnline);
    }

    return isNowOnline;

  } catch (error) {
    if (this.isOnline) {
      this.isOnline = false;
      this.lastStatusChange = Date.now();
      this.notifyListeners('offline', false);
    }
    return false;
  }
}


  // Verificación con throttle (para evitar muchas llamadas al hacer click)
  checkConnectionThrottled() {
    const now = Date.now();
    if (now - this.lastCheckTime > 2000) { // Máximo cada 2 segundos
      this.lastCheckTime = now;
      this.checkConnection();
    }
  }

  // Polling cada 10 segundos
  startPolling() {
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, 10000); // Cada 10 segundos
  }

  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Evento online 
  handleOnline() {
    // Verificar conexión real antes de notificar
    setTimeout(() => {
      this.checkConnection();
    }, 500);
  }

  // Evento offline 
  handleOffline() {
    if (this.isOnline) {
      this.isOnline = false;
      this.lastStatusChange = Date.now();
      this.notifyListeners('offline', false);
    }
  }

  // Suscribirse a cambios
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners(status, online) {
    this.listeners.forEach(callback => {
      try {
        callback(status, online);
      } catch (error) {
        console.error('Error en listener de conexión:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('focus', this.checkConnection);
    document.removeEventListener('click', this.checkConnectionThrottled);
    this.stopPolling();
    this.listeners = [];
  }

  // Método para forzar verificación manual
  forceCheck() {
    return this.checkConnection();
  }

  // Obtener estado actual
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastStatusChange: this.lastStatusChange,
      timeSinceChange: Date.now() - this.lastStatusChange,
      navigatorOnLine: navigator.onLine
    };
  }
}

// Singleton
let detectorInstance = null;

export const getConnectionDetector = () => {
  if (!detectorInstance) {
    detectorInstance = new ConnectionDetector();
  }
  return detectorInstance;
};

export const isOnline = () => {
  const detector = getConnectionDetector();
  return detector.isOnline;
};

export default getConnectionDetector;