declare module 'shpjs' {
  function shp(buffer: ArrayBuffer | Buffer | string): Promise<any>;
  export = shp;
}
