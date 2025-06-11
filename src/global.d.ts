/* eslint-disable @typescript-eslint/no-explicit-any */
export {}; // để nó biến thành module

declare global {
  interface Window {
    shaka: any;
    SigmaPacker: any;
    sigmaPacker: any;
  }
}
