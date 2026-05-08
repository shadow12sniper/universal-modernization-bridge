declare module "sql.js" {
  // Constructor for the database
  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, any>;
    free(): boolean;
  }

  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  // What initSqlJs() resolves to – the SQL object containing the Database constructor
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  export interface Config {
    locateFile?: (url: string, scriptDirectory: string) => string;
  }

  // The default export returns a Promise that resolves to the SQL static object
  export default function initSqlJs(config?: Config): Promise<SqlJsStatic>;
}