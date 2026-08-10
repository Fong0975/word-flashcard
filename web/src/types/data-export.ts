/**
 * Types for the full-database export/import payload
 *
 * These mirror the backend's raw `data/models` row shape exactly (see
 * `internal/models/data_export.go`), including ids and timestamps, so an
 * export can be re-imported with full fidelity. They are intentionally
 * separate from the entity types in `./api.ts`, which represent the
 * app's normal (transformed) API shape rather than a raw DB row -- e.g.
 * `WordDefinition.phonetics`/`examples` are raw JSON-as-text strings here,
 * not the parsed object/array the rest of the app works with.
 */

import { BaseEntity } from './base';

export interface ExportedWord extends BaseEntity {
  readonly word: string;
  readonly familiarity: string;
  readonly reminder: string | null;
  readonly count_practise: number;
  readonly last_practiced_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ExportedWordDefinition extends BaseEntity {
  readonly word_id: number;
  readonly part_of_speech: string;
  readonly definition: string;
  readonly phonetics: string | null;
  readonly examples: string | null;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ExportedQuestion extends BaseEntity {
  readonly question: string;
  readonly option_a: string;
  readonly option_b: string | null;
  readonly option_c: string | null;
  readonly option_d: string | null;
  readonly answer: string;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly count_practise: number;
  readonly count_failure_practise: number;
  readonly last_answered_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ExportedQuestionAnswerLog extends BaseEntity {
  readonly question_id: number;
  readonly selected_option: string;
  readonly is_correct: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ExportedWordPracticeLog extends BaseEntity {
  readonly word_id: number;
  readonly familiarity: string;
  readonly previous_familiarity: string;
  readonly quiz_session_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ExportedNote extends BaseEntity {
  readonly title: string;
  readonly content: string | null;
  readonly sort_order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Full-fidelity snapshot of every table. Used as both the response body of
 * `GET /api/data/export` and the request body of `POST /api/data/import`.
 */
export interface DataExportPayload {
  readonly exported_at: string;
  readonly words: readonly ExportedWord[];
  readonly word_definitions: readonly ExportedWordDefinition[];
  readonly questions: readonly ExportedQuestion[];
  readonly question_answer_logs: readonly ExportedQuestionAnswerLog[];
  readonly word_practice_logs: readonly ExportedWordPracticeLog[];
  readonly notes: readonly ExportedNote[];
}

/** Row counts written per table, returned by a completed import. */
export interface ImportSummary {
  readonly words: number;
  readonly word_definitions: number;
  readonly questions: number;
  readonly question_answer_logs: number;
  readonly word_practice_logs: number;
  readonly notes: number;
}
