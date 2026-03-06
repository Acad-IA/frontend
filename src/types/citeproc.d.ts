declare module 'citeproc' {
  const CSL: {
    Engine: new (
      sys: any,
      style: string,
      lang?: string,
      forceLang?: boolean,
    ) => any
  }

  export default CSL
}
