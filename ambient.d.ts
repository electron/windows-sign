// Define ambient types for modules used in tests
declare module 'postject' {
  const postject: any;
  export default postject;
}

// Allow import.meta for ES modules
declare namespace NodeJS {
  interface Process {
    versions: {
      node: string;
    } & Record<string, string>;
  }
}

interface ImportMeta {
  readonly url: string;
  readonly dirname: string;
}