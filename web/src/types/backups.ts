/**
 * Type for a single on-disk backup file entry
 *
 * Mirrors the backend's `internal/models.BackupFile` (see
 * `GET /api/data/backups`) -- the scheduled backups written under the
 * server's `./backups/` directory, not the manual export/import payload in
 * `./data-export.ts`.
 */
export interface BackupFile {
  readonly name: string;
  readonly size_bytes: number;
  readonly modified_at: string;
  /** Absent for backups created before the counts were recorded in the file header. */
  readonly summary?: BackupSummary;
}

/** Mirrors the backend's `internal/models.BackupSummary`. */
export interface BackupSummary {
  readonly words: number;
  readonly questions: number;
  readonly notes: number;
}
