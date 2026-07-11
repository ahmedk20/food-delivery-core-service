import { connect, type AmqpConnectionManager, type ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import type { IMessageBroker } from '../message-broker.interface';
import type { RabbitMQConfig } from './rabbitmq.types';

export class RabbitMQClient implements IMessageBroker {
    private connection: AmqpConnectionManager | null = null;
    private publishChannel: ChannelWrapper | null = null;

    constructor(private readonly config: RabbitMQConfig) {}

    async connect(): Promise<void> {
        // amqp-connection-manager auto-reconnects and re-runs channel setups,
        // so a dropped broker connection self-heals without us writing retry logic.
        this.connection = connect([this.config.url], {
            reconnectTimeInSeconds: this.config.reconnectInitialMs / 1000,
        });

        this.publishChannel = this.connection.createChannel({ json: false });
        await this.publishChannel.waitForConnect();
    }

    async close(): Promise<void> {
        await this.publishChannel?.close();
        await this.connection?.close();
        this.publishChannel = null;
        this.connection = null;
    }

    async assertExchange(exchange: string): Promise<void> {
        if (!this.connection) throw new Error('RabbitMQClient not connected');

        // A short-lived channel just to declare the exchange. Because the exchange
        // is durable it survives broker restarts, so we only need to assert once.
        const ch = this.connection.createChannel({
            json: false,
            setup: async (channel: ConfirmChannel) => {
                await channel.assertExchange(exchange, 'topic', { durable: true });
            },
        });
        await ch.waitForConnect();
        await ch.close();
    }

    async publish(exchange: string, routingKey: string, body: Buffer): Promise<void> {
        if (!this.publishChannel) throw new Error('RabbitMQClient not connected');
        // persistent: true → message is written to disk by the broker, matching the
        // durability we already paid for by storing it in Postgres first.
        await this.publishChannel.publish(exchange, routingKey, body, { persistent: true });
    }
}
