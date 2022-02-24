// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class IgeClass {
	static extend<T extends IgeClass & { init: (...args: unknown[]) => unknown }> (options: T):
	new(...args: Parameters<typeof options.init>) => T;
}
