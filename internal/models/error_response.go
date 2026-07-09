package models

// ErrorCode is a stable, machine-readable category for an API error response.
// Clients use it to branch on the failure type without depending on the
// human-readable message text, which must never contain internal error
// detail (stack traces, SQL errors, file paths, upstream addresses, etc.).
type ErrorCode string

const (
	// ErrCodeInvalidRequest marks malformed input: bad IDs, query params, JSON body, or filter syntax.
	ErrCodeInvalidRequest ErrorCode = "invalid_request"
	// ErrCodeValidationError marks a request that parsed correctly but failed field-level validation.
	ErrCodeValidationError ErrorCode = "validation_error"
	// ErrCodeNotFound marks a request for a resource that does not exist.
	ErrCodeNotFound ErrorCode = "not_found"
	// ErrCodeConflict marks a request that would violate a uniqueness constraint (e.g. duplicate name/title).
	ErrCodeConflict ErrorCode = "conflict"
	// ErrCodeInternalError marks an unexpected server-side failure (database, data integrity, etc.).
	// The response message must stay generic; details belong in the server log only.
	ErrCodeInternalError ErrorCode = "internal_error"
	// ErrCodeUpstreamUnavailable marks a failure to reach or use a dependent service (e.g. the dictionary API).
	ErrCodeUpstreamUnavailable ErrorCode = "upstream_unavailable"
)

// ErrorResponse represents a standard error response structure for all APIs
type ErrorResponse struct {
	Error string    `json:"error"`
	Code  ErrorCode `json:"code,omitempty"`
}
