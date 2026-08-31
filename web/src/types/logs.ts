/**
 * Types for the backend log viewer
 *
 * Mirrors the backend's `internal/models.LogEntry` (see `GET /api/logs`),
 * which parses the files written by the Go side's slog handler.
 */

/** Severity levels the backend emits, ordered from least to most severe. */
export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * One parsed log record.
 *
 * Satisfies `BaseEntity` so the list can reuse the shared pagination hooks.
 */
export interface LogEntry {
  /**
   * Scan sequence number over the current filter (1 = newest entry), NOT a
   * stable identifier -- every entry shifts position as soon as new lines are
   * written or the log rotates. Use it as a render key only; never persist it
   * or use it to mark an entry as read.
   */
  readonly id: number;
  /** RFC3339 timestamp parsed from the log line itself. */
  readonly timestamp: string;
  readonly level: LogLevel;
  /** Emitting call site, e.g. `main.go:49`. */
  readonly source: string;
  /**
   * The message, with the backend's `[key=value, ...]` attribute suffix left
   * in place. Attributes are not escaped by the Go handler, so splitting them
   * apart is unreliable -- they are shown verbatim instead. Multi-line values
   * such as panic stack traces arrive with embedded newlines.
   */
  readonly message: string;
  /** Log file the entry came from -- the current file or a rotated one. */
  readonly file: string;
}

/** Filter and pagination params for `GET /api/logs` and `/api/logs/count`. */
export interface LogsQueryParams {
  readonly limit?: number;
  readonly offset?: number;
  /** Level allow-list; empty or omitted means every level. */
  readonly levels?: readonly LogLevel[];
  /** Inclusive lower bound, as RFC3339 or `YYYY-MM-DD`. */
  readonly from?: string;
  /** Inclusive upper bound; a plain date covers the whole day. */
  readonly to?: string;
}

/** Response of `POST /api/logs/read`. */
export interface LogReadState {
  readonly last_read_at: string;
}
