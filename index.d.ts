declare module 'event-emitter-extra' {
    class EventEmitterExtra {
        static defaultMaxListeners: number;
        static defaultMaxRegexListeners: number;

        constructor();

        addListener(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>,
            ttl?: number
        ): EventEmitterExtra;

        on(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>
        ): EventEmitterExtra;

        once(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>
        ): EventEmitterExtra;

        many(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>,
            ttl?: number
        ): EventEmitterExtra;

        prependListener(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>,
            ttl?: number
        ): EventEmitterExtra;

        prependOnceListener(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>
        ): EventEmitterExtra;

        prependManyListener(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>,
            ttl?: number
        ): EventEmitterExtra;

        emit(
            eventName: String|Array<String>,
            ...args: any[]
        ): false|any[];

        emitAsync(
            eventName: String|Array<String>,
            ...args: any[]
        ): Promise<any[]>;

        eventNames(): string[];

        getMaxListeners(): number;

        getMaxRegexListeners(): number;

        listenerCount(eventName: string|RegExp): number;

        listeners(eventName: string|RegExp): Function[];

        removeAllListeners(eventName?: String|RegExp|Array<String|RegExp>): EventEmitterExtra;

        removeListener(
            eventName: string|RegExp|Array<String|RegExp>,
            listener: (...args: any[]) => any|Array<(...args: any[]) => any>
        ): EventEmitterExtra;

        setMaxListeners(n: number): EventEmitterExtra;

        setMaxRegexListeners(n: number): EventEmitterExtra;
    }

    export = EventEmitterExtra;
}
