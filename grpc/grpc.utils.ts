export const promisify = <T extends object>(service: T) =>
  new Proxy(service, {
    get:
      (svc: any, methodName: string) =>
      (...params: any[]) =>
        svc[methodName](...params).toPromise(),
  });
