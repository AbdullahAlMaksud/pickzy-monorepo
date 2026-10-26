export interface Migration {
  /** Strictly increasing integer; stored in `PRAGMA user_version`. */
  version: number;
  name: string;
  /** Statements run in order inside ONE transaction together with the version bump. */
  statements: string[];
}
