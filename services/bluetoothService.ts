
export const bluetoothService = {
  // Fix: Use any to avoid "Cannot find name" errors for Web Bluetooth types
  device: null as any,
  characteristic: null as any,

  async connect(): Promise<boolean> {
    try {
      // Fix: Cast navigator to any to access the experimental bluetooth property
      const bluetooth = (navigator as any).bluetooth;
      if (!bluetooth) return false;

      // Searching for devices supporting the Immediate Alert service (standard for vibrations)
      // and the Alert Notification service.
      const device = await bluetooth.requestDevice({
        filters: [
          { services: ['immediate_alert'] },
          { services: ['alert_notification'] }
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      const server = await device.gatt?.connect();
      if (!server) return false;

      // Primary service for triggering vibrations (Immediate Alert)
      const service = await server.getPrimaryService('immediate_alert');
      this.characteristic = await service.getCharacteristic('alert_level');
      
      this.device = device;
      console.log("Watch connected:", device.name);
      return true;
    } catch (error) {
      console.error("Bluetooth Connection Failed:", error);
      return false;
    }
  },

  async sendVibrationAlert(level: 0 | 1 | 2 = 2): Promise<void> {
    if (!this.characteristic) return;
    try {
      // 0 = No Alert, 1 = Mild, 2 = Strong Vibration
      const data = new Uint8Array([level]);
      await this.characteristic.writeValue(data);
    } catch (error) {
      console.error("Failed to send vibration:", error);
    }
  },

  async disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  },

  isConnected(): boolean {
    return !!this.device?.gatt?.connected;
  }
};