/**
 * promisify all methods on service except specified
 * for example for streaming
 */
export const promisify = <T extends object>(service: T, except: string[] = []) =>
  new Proxy(service, {
    get:
      (svc: any, methodName: string) =>
      (...params: any[]) => {
        if (except.includes(methodName)) return svc[methodName](...params);

        return svc[methodName](...params).toPromise();
      },
  });
