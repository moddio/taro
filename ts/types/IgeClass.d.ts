declare class IgeClass {
	static extend<T extends IgeClass & { init(...args: any[]) }> (options: T):
        new(...args: Parameters<typeof options.init>) => T;
}
