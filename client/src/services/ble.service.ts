// Standard Health Service UUIDs
const SERVICES = {
    BLOOD_PRESSURE: 0x1810,
    PULSE_OXIMETER: 0x1822,
    HEART_RATE: 0x180D,
    HEALTH_THERMOMETER: 0x1809,
    GLUCOSE: 0x1808
};

export const scanForDevices = async () => {
    try {
        // @ts-ignore - Navigator.bluetooth is experimental
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SERVICES.BLOOD_PRESSURE] },
                { services: [SERVICES.PULSE_OXIMETER] },
                { services: [SERVICES.HEART_RATE] },
                { services: [SERVICES.HEALTH_THERMOMETER] },
                { services: [SERVICES.GLUCOSE] }
            ],
            optionalServices: Object.values(SERVICES)
        });
        return device;
    } catch (error) {
        console.error("BLE Scan Error:", error);
        throw error;
    }
};

export const connectToDevice = async (device: any, onDisconnect: any) => {
    try {
        const server = await device.gatt.connect();
        device.addEventListener('gattserverdisconnected', onDisconnect);
        return server;
    } catch (error) {
        console.error("BLE Connect Error:", error);
        throw error;
    }
};

export const startNotifications = async (server: any, serviceUUID: any, characteristicUUID: any, callback: any) => {
    try {
        const service = await server.getPrimaryService(serviceUUID);
        const characteristic = await service.getCharacteristic(characteristicUUID);
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
            const value = event.target.value;
            callback(parseValue(value, serviceUUID));
        });
    } catch (error) {
        console.error("BLE Notify Error:", error);
    }
};

const parseValue = (dataView: DataView, serviceUUID: number) => {
    // Basic parsers for demo purposes. Real implementation needs bit manipulation based on BLE specs.
    // For simplicity/demo in this isolated module:

    // Heart Rate
    if (serviceUUID === SERVICES.HEART_RATE) {
        const flags = dataView.getUint8(0);
        const rate16Bits = flags & 0x1;
        let result: any = {};
        if (rate16Bits) {
            result.value = dataView.getUint16(1, true);
        } else {
            result.value = dataView.getUint8(1);
        }
        result.type = 'HR';
        result.unit = 'bpm';
        return result;
    }

    // Thermometer
    if (serviceUUID === SERVICES.HEALTH_THERMOMETER) {
        // IEEE 11073 32-bit float
        const mantissa = dataView.getUint8(2) | (dataView.getUint8(3) << 8) | (dataView.getUint8(4) << 16);
        const exponent = dataView.getInt8(5);
        const temp = mantissa * Math.pow(10, exponent);
        return { type: 'TEMP', value: temp.toFixed(1), unit: '°C' };
    }

    // Fallback for Pulse Ox / BP (Complex structures, simplified for demo)
    if (serviceUUID === SERVICES.PULSE_OXIMETER) {
        // Mock parsing for SpO2
        return { type: 'SPO2', value: 98, unit: '%' };
    }

    if (serviceUUID === SERVICES.BLOOD_PRESSURE) {
        // Mock parsing for BP
        return { type: 'BP', value: '120/80', unit: 'mmHg' };
    }

    return { type: 'UNKNOWN', value: 0, unit: '' };
};
