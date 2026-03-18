// Temporary JSX type shim until node_modules are installed
declare namespace React {
  interface ReactElement {}
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
