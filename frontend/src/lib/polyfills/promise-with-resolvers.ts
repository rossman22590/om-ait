/**
 * Polyfill for Promise.withResolvers
 * This feature was added in a recent ECMAScript specification
 * This polyfill enables compatibility with older JavaScript environments
 */

if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve, reject };
  };
}

export {};
