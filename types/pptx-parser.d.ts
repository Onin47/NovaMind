declare module 'pptx-parser' {
  const parse: (buffer: Buffer) => Promise<Array<{ content?: string }>>
  export default parse
}
