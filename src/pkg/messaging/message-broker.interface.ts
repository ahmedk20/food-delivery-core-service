// Core-service is a publish-only participant in the event bus: it emits domain
// events but never consumes them. The interface is therefore narrower than a
// full broker (no queues / consume) — just enough to push messages.
export interface IMessageBroker {
    connect(): Promise<void>;
    close(): Promise<void>;
    // Idempotently declares the topic exchange we publish to. Safe to call even
    // if the consuming service already declared the same exchange.
    assertExchange(exchange: string): Promise<void>;
    publish(exchange: string, routingKey: string, body: Buffer): Promise<void>;
}
