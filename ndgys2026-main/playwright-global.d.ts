declare module "@playwright/test" {
  export const test: any;
  export const expect: any;
  export function describe(name: string, fn: Function): void;
  export function beforeAll(fn: Function): void;
  export function afterAll(fn: Function): void;
  export function beforeEach(fn: Function): void;
  export function afterEach(fn: Function): void;
  export type Page = any;
  export type Browser = any;
  export type Locator = any;
}

export {};
