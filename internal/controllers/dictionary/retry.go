package dictionary

import (
	"context"
	"errors"
	"io"

	// math/rand only spreads retry delays apart (jitter); the value is never
	// used for secrets or identifiers, so a CSPRNG would add nothing.
	"math/rand" // nosemgrep: go.lang.security.audit.crypto.math_random.math-random-used
	"net"
	"net/http"
	"syscall"
	"time"

	"word-flashcard/internal/controllers/common"
)

const (
	// geminiMaxAttempts is the total number of tries (first request plus retries).
	geminiMaxAttempts = 3

	// geminiTotalTimeout bounds the whole retry flow. It must stay below the
	// frontend dictionary lookup timeout so the client always receives the
	// backend's verdict instead of aborting first.
	geminiTotalTimeout = 25 * time.Second

	// geminiAttemptTimeout bounds a single attempt; it is further capped by
	// the time left before geminiTotalTimeout.
	geminiAttemptTimeout = 10 * time.Second

	// geminiMinAttemptWindow is the least time that must remain after a
	// backoff for another attempt to be worth starting.
	geminiMinAttemptWindow = 3 * time.Second

	geminiBaseBackoff = 500 * time.Millisecond
	geminiMaxBackoff  = 4 * time.Second
	geminiJitterRatio = 0.2
)

// retryPolicy describes how doWithRetry spaces and bounds its attempts. Sleep
// and Rand are injection points for tests; nil selects the real implementations.
type retryPolicy struct {
	MaxAttempts      int
	TotalTimeout     time.Duration
	AttemptTimeout   time.Duration
	MinAttemptWindow time.Duration
	BaseDelay        time.Duration
	MaxDelay         time.Duration
	JitterRatio      float64

	Sleep func(ctx context.Context, d time.Duration) error
	Rand  func() float64
}

// defaultRetryPolicy returns the production policy for Gemini requests.
func defaultRetryPolicy() retryPolicy {
	return retryPolicy{
		MaxAttempts:      geminiMaxAttempts,
		TotalTimeout:     geminiTotalTimeout,
		AttemptTimeout:   geminiAttemptTimeout,
		MinAttemptWindow: geminiMinAttemptWindow,
		BaseDelay:        geminiBaseBackoff,
		MaxDelay:         geminiMaxBackoff,
		JitterRatio:      geminiJitterRatio,
	}
}

// httpStatusError is implemented by errors that carry an upstream HTTP status
// and an optional parsed Retry-After delay.
type httpStatusError interface {
	HTTPStatus() int
	RetryAfterDelay() time.Duration
}

// isRetryable reports whether err is a transient failure worth another attempt:
// upstream 500/503/504, 429 with a Retry-After hint, and network-level
// failures (timeouts, connection resets, unexpected EOF). Caller cancellation,
// client errors and everything else are not retried.
func isRetryable(err error, maxDelay time.Duration) bool {
	if err == nil || errors.Is(err, context.Canceled) {
		return false
	}

	var statusErr httpStatusError
	if errors.As(err, &statusErr) {
		switch statusErr.HTTPStatus() {
		case http.StatusInternalServerError, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
			return true
		case http.StatusTooManyRequests:
			retryAfter := statusErr.RetryAfterDelay()
			return retryAfter > 0 && retryAfter <= maxDelay
		default:
			return false
		}
	}

	if errors.Is(err, context.DeadlineExceeded) ||
		errors.Is(err, io.EOF) ||
		errors.Is(err, io.ErrUnexpectedEOF) ||
		errors.Is(err, syscall.ECONNRESET) {
		return true
	}

	var netErr net.Error
	return errors.As(err, &netErr) && netErr.Timeout()
}

// retryAfterOf returns the Retry-After delay carried by err, or zero.
func retryAfterOf(err error) time.Duration {
	var statusErr httpStatusError
	if errors.As(err, &statusErr) {
		return statusErr.RetryAfterDelay()
	}
	return 0
}

// statusOf returns the upstream HTTP status carried by err, or zero.
func statusOf(err error) int {
	var statusErr httpStatusError
	if errors.As(err, &statusErr) {
		return statusErr.HTTPStatus()
	}
	return 0
}

// backoffDelay returns how long to wait after the given failed attempt
// (1-based): BaseDelay doubled per attempt, jittered by ±JitterRatio, raised to
// retryAfter when the server asked for longer, and capped at MaxDelay.
func (p retryPolicy) backoffDelay(attempt int, retryAfter time.Duration) time.Duration {
	delay := p.BaseDelay
	for i := 1; i < attempt && delay < p.MaxDelay; i++ {
		delay *= 2
	}
	if delay > p.MaxDelay {
		delay = p.MaxDelay
	}

	randFn := p.Rand
	if randFn == nil {
		randFn = rand.Float64
	}
	delay = time.Duration(float64(delay) * (1 + p.JitterRatio*(2*randFn()-1)))

	if retryAfter > delay {
		delay = retryAfter
	}
	if delay > p.MaxDelay {
		delay = p.MaxDelay
	}
	return delay
}

// sleep waits for d or until ctx ends, whichever comes first.
func (p retryPolicy) sleep(ctx context.Context, d time.Duration) error {
	if p.Sleep != nil {
		return p.Sleep(ctx, d)
	}
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// doWithRetry runs op until it succeeds, fails with a non-retryable error, or
// the policy's attempt count, total timeout or minimum attempt window is
// exhausted. Each attempt receives a context capped by both the per-attempt
// timeout and the time left in the total budget. onRetry, if non-nil, is
// called before each backoff wait. It returns op's value, the number of
// attempts made and the last error; a failure after more than one attempt is
// annotated with the attempt count for the error log.
func doWithRetry[T any](
	ctx context.Context,
	p retryPolicy,
	op func(ctx context.Context) (T, error),
	onRetry func(attempt int, err error, delay time.Duration),
) (T, int, error) {
	ctx, cancel := context.WithTimeout(ctx, p.TotalTimeout)
	defer cancel()
	deadline, _ := ctx.Deadline()

	var zero T
	for attempt := 1; ; attempt++ {
		attemptCtx, cancelAttempt := context.WithTimeout(ctx, min(p.AttemptTimeout, time.Until(deadline)))
		value, err := op(attemptCtx)
		cancelAttempt()
		if err == nil {
			return value, attempt, nil
		}

		if attempt >= p.MaxAttempts || ctx.Err() != nil || !isRetryable(err, p.MaxDelay) {
			return zero, attempt, withAttempts(err, attempt)
		}
		retryAfter := retryAfterOf(err)
		if retryAfter > p.MaxDelay {
			return zero, attempt, withAttempts(err, attempt)
		}

		delay := p.backoffDelay(attempt, retryAfter)
		if time.Until(deadline)-delay < p.MinAttemptWindow {
			return zero, attempt, withAttempts(err, attempt)
		}

		if onRetry != nil {
			onRetry(attempt, err, delay)
		}
		if sleepErr := p.sleep(ctx, delay); sleepErr != nil {
			return zero, attempt, withAttempts(err, attempt)
		}
	}
}

// attemptsError wraps err with a log-only "attempts" detail while keeping
// both the original error chain and its own DetailedError discoverable via
// errors.Is / errors.As.
type attemptsError struct {
	err    error
	detail error
}

func (e *attemptsError) Error() string   { return e.err.Error() }
func (e *attemptsError) Unwrap() []error { return []error{e.detail, e.err} }

// withAttempts annotates err with the number of attempts made. A single
// attempt carries no extra information, so err is returned unchanged.
func withAttempts(err error, attempts int) error {
	if attempts <= 1 {
		return err
	}

	var detail []any
	var de *common.DetailedError
	if errors.As(err, &de) {
		detail = append(detail, de.LogDetail()...)
	}
	detail = append(detail, "attempts", attempts)

	return &attemptsError{err: err, detail: common.NewDetailedError(err.Error(), detail...)}
}
