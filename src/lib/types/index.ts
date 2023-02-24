export * from './Shapes';
export type Optional<T, K extends keyof T> = Partial<T> & Omit<T, K>;
export type Need<T, K extends keyof T> = Partial<T> & Pick<T, K>;