declare module '*.css';

// Allow importing CSS files as side effects
declare module '@/app/globals.css' {
  const _default: unknown;
  export default _default;
}
