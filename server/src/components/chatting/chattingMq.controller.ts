import { ChattingModel } from '@/src/db/model/chatting';
import { validateRequired } from '@/src/util/validation/requestValidation';
import { DocumentDefinition } from 'mongoose';
import mqtt, { MqttClient } from 'mqtt';
import { getUserByToken } from '../auth/helpers';
import { CHATTING_ERROR_TOPIC, CHATTING_TOPIC } from './constants';
import { Chatting, MyMqtt, MyMqttOption } from './types';

export class MyMqttImpl implements MyMqtt {

  client?: MqttClient;

  constructor(
    readonly host: string,
    readonly port: number
  ) {}

  static getInstance(mqttOptions: MyMqttOption): MyMqtt {
    return new MyMqttImpl(mqttOptions.host, mqttOptions.port);
  }

  connect(): MqttClient {

    const client = mqtt.connect({
      host: this.host,
      port: this.port,
    });

    this.client = client;

    client.on('connect', () => {
      console.log(`chatting subscriber connected ${this.host}:${this.port}`);
      client.subscribe(`${CHATTING_TOPIC}/+`);
      console.log(`subscribe topic:`, CHATTING_TOPIC);
    });

    client.on('message', async (topic, payload) => {

      if (topic.includes('error')) {
        return;
      }

      try {
        const jsonPayload = JSON.parse(payload.toString());
        if (typeof jsonPayload !== 'object') {
          console.error('object error');
          return;
        }

        const { token } = jsonPayload;
        const user = getUserByToken(token);
        // if (!user.id) {
        //   this.publishError({
        //     result: 'fail',
        //     message: 'user token error'
        //   });
        //   return;
        // }

        const validation = validateRequired<Chatting>(jsonPayload, ['createdAt', 'createdBy', 'message']);
        if (validation.result === 'fail') {
          this.publishError(validation);
          console.error('required:', validation.missed);
          return;
        }

        const createdBy = user.id || validation.data.createdBy;

        const chatting: DocumentDefinition<Chatting> = {
          roomId: validation.data.roomId,
          message: validation.data.message,
          createdAt: new Date(),
          createdBy,
        };

        await ChattingModel.create(chatting);
      } catch (e) {
        console.error(e);
        const { message } = e as Error;
        // this.publishError({
        //   result: false,
        //   message,
        // });
      }

    });

    return client;
  }

  publish<T extends Record<string, any>> (topic: string, payload: T) {
    if (!this.client) {
      throw new Error('no client');
    }
    this.client.publish(topic, JSON.stringify(payload));
  }

  publishError<T extends Record<string, any>> (payload: T) {
    if (!this.client) {
      throw new Error('no client');
    }
    this.client.publish(CHATTING_ERROR_TOPIC, JSON.stringify(payload));
    console.log('published topic', CHATTING_ERROR_TOPIC);
  }
}