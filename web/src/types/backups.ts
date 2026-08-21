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
}
