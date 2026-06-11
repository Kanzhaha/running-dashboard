import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

const MQTT_URL =
  process.env.REACT_APP_MQTT_URL ||
  'wss://102971540e144709a2789a97b0029082.s1.eu.hivemq.cloud:8884/mqtt';

const MQTT_USERNAME =
  process.env.REACT_APP_MQTT_USERNAME || 'KanzRUN';

const MQTT_PASSWORD =
  process.env.REACT_APP_MQTT_PASSWORD || 'Running123';

const MQTT_TOPICS: string[] = [
  'wearable/telemetry',
  'wearable/config/status',
  'wearable/availability',
  'wearable/status',
];

export const useMqtt = () => {
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
      clientId: `dashboard_${Math.random().toString(16).slice(2)}`,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 3000,
      clean: true,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);

      client.subscribe(MQTT_TOPICS, (err) => {
        if (err) {
          console.error('MQTT subscribe error:', err);
        }
      });
    });

    client.on('message', (topic, payload) => {
      const text = payload.toString();

      if (topic === 'wearable/telemetry') {
        try {
          const d = JSON.parse(text);

          setMessages((prev) => ({
            ...prev,

            // Raw telemetry JSON, useful for debugging
            'wearable/telemetry': text,

            // Identity / status
            'wearable/mode': String(d.mode ?? '-'),
            'wearable/source': String(d.source ?? '-'),
            'wearable/gps_status': String(d.gps_status ?? 'NOFIX'),

            // Physiological metrics
            'wearable/heartrate': String(d.hr ?? 0),
            'wearable/hrv/mean_rr': String(d.mean_rr ?? 0),
            'wearable/hrv/sdnn': String(d.sdnn ?? 0),
            'wearable/hrv/rmssd': String(d.rmssd ?? 0),

            // Running power components
            'wearable/power/total': String(d.power_total ?? 0),
            'wearable/power/aero': String(d.power_aero ?? 0),
            'wearable/power/climb': String(d.power_climb ?? 0),
            'wearable/power/acc': String(d.power_acc ?? 0),
            'wearable/power/vert': String(d.power_vert ?? 0),

            // Biomechanical metrics
            'wearable/cadence': String(d.cadence ?? 0),
            'wearable/gct': String(d.gct ?? 0),
            'wearable/vo': String(d.vo ?? 0),

            // Speed and movement
            'wearable/speed': String(d.speed ?? 0),
            'wearable/speed/gps': String(d.speed_gps ?? 0),
            'wearable/speed/estimated': String(d.speed_est ?? 0),
            'wearable/distance': String(d.distance ?? 0),
            'wearable/elevation': String(d.elevation ?? 0),
            'wearable/latitude': String(d.latitude ?? 0),
            'wearable/longitude': String(d.longitude ?? 0),
            'wearable/pace': String(d.pace ?? 0),

            // Fatigue / efficiency
            'wearable/efficiency_index': String(d.eff_index ?? 0),
            'wearable/decoupling': String(d.decoupling ?? 0),
            'wearable/fatigue_status': String(d.fatigue ?? 'INIT'),
          }));
        } catch (err) {
          console.error('Telemetry JSON parse error:', err, text);
        }

        return;
      }

      setMessages((prev) => ({
        ...prev,
        [topic]: text,
      }));
    });

    client.on('close', () => setIsConnected(false));
    client.on('offline', () => setIsConnected(false));
    client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    return () => {
      setIsConnected(false);
      client.end(true);
      clientRef.current = null;
    };
  }, []);

  const publish = (topic: string, payload: string) => {
    if (!clientRef.current || !isConnected) return;

    clientRef.current.publish(topic, payload, {
      qos: 0,
      retain: false,
    });
  };

  return { isConnected, messages, publish };
};