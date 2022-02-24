declare class IgeEngine extends IgeClass {
    isClient: boolean;
    isServer: boolean;

    client: unknown; // TODO proper types
    server: unknown;

    constructor (options?: object);
}
