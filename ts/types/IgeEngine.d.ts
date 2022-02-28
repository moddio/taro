declare class IgeEngine extends IgeClass {

    isClient: boolean;
    isServer: boolean;

    client: any; // TODO proper types
    server: any;

    constructor(options: object);
}
