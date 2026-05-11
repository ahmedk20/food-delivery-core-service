export const TOKENS = {
    // Infrastructure
    CacheProvider:      Symbol('CacheProvider'),
    CoreServiceClient:  Symbol('CoreServiceClient'),
    PaymentProvider:    Symbol('PaymentProvider'),
    SocketServer:       Symbol('SocketServer'),
    MessageBroker:      Symbol('MessageBroker'),

    // Services
    OrderService:           Symbol('OrderService'),
    PaymentService:         Symbol('PaymentService'),
    DeliveryService:        Symbol('DeliveryService'),
    AgentService:           Symbol('AgentService'),
    RestaurantOrderService: Symbol('RestaurantOrderService'),
    AdminService:           Symbol('AdminService'),

    // Controllers
    OrderController:           Symbol('OrderController'),
    PaymentController:         Symbol('PaymentController'),
    DeliveryController:        Symbol('DeliveryController'),
    AgentController:           Symbol('AgentController'),
    RestaurantOrderController: Symbol('RestaurantOrderController'),
    AdminController:           Symbol('AdminController'),
};
