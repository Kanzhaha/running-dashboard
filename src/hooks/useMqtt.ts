import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

const MQTT_URL =
  process.env.REACT_APP_MQTT_URL ||
  'ws://broker.emqx.io:8083/mqtt';

const MQTT_USERNAME =
  process.env.REACT_APP_MQTT_USERNAME || '';

const MQTT_PASSWORD =
  process.env.REACT_APP_MQTT_PASSWORD || '';

const MQTT_TOPICS: string[] = [
  'wearable/config/status',
  'wearable/heartrate',
  'wearable/hrv/mean_rr',
  'wearable/hrv/sdnn',
  'wearable/hrv/rmssd',
  'wearable/power/total',
  'wearable/power/aero',
  'wearable/power/climb',
  'wearable/power/acc',
  'wearable/power/vert',
  'wearable/cadence',
  'wearable/gct',
  'wearable/vo',
  'wearable/speed',
  'wearable/speed/gps',
  'wearable/speed/estimated',
  'wearable/distance',
  'wearable/elevation',
  'wearable/latitude',
  'wearable/longitude',
  'wearable/pace',
  'wearable/efficiency_index',
  'wearable/decoupling',
  'wearable/fatigue_status',
  'wearable/mode',
  'wearable/source',
  'wearable/gps_status',
  'wearable/availability',
];

export const useMqtt = () => {
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
    clientId: `dashboard_${Math.random().toString(16).slice(2)}`,
    username: MQTT_USERNAME || undefined,
    password: MQTT_PASSWORD || undefined,
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
      setMessages((prev) => ({
        ...prev,
        [topic]: payload.toString(),
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