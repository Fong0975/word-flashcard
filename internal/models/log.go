package models

import "time"

// LogEntry represents a single record parsed out of a backend log file, as
// returned by GET /api/logs.
//
// ID is only a scan sequence number (1 = newest entry matching the current
// filter), not a stable identifier: entries shift position as soon as new
// lines are written or a rotation happens. It exists so the frontend has a
// key for rendering and can reuse the shared pagination hooks -- it must
// never be persisted or used to mark an entry as read.
type LogEntry struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Source    string    `json:"source"`
	Message   string    `json:"message"`
	File      string    `json:"file"`
}
