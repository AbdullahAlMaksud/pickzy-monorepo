declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg' {
  const content: number;
  export default content;
}

declare module '*.svg' {
  const content: number;
  export default content;
}

declare module '*.ttf' {
  import type { FontSource } from 'expo-font';
  const content: FontSource;
  export default content;
}
