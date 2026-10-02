package dictionary

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"syscall"
	"testing"
	"time"

	"word-flashcard/internal/controllers/common"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fastRetryPolicy returns a policy that keeps the production attempt count but
// never actually waits, so tests exercising retries stay instant.
func fastRetryPolicy() retryPolicy {
	return retryPolicy{
		MaxAttempts:      geminiMaxAttempts,
		TotalTimeout:     5 * time.Second,
		AttemptTimeout:   2 * time.Second,
		MinAttemptWindow: 0,
		BaseDelay:        time.Millisecond,
		MaxDelay:         4 * time.Millisecond,
		JitterRatio:      0,
		Sleep:            func(context.Context, time.Duration) error { return nil },
	}
}

// newStatusError builds a geminiHTTPError for tests.
func newStatusError(status int, retryAfter time.Duration) error {
	return &geminiHTTPError{
		statusCode: status,
		retryAfter: retryAfter,
		detail:     common.NewDetailedError(fmt.Sprintf("gemini request returned HTTP %d", status), "url", "https://example.test"),
	}
}

// timeoutNetError is a net.Error whose Timeout() result is configurable.
type timeoutNetError struct{ timeout bool }

func (e timeoutNetError) Error() string   { return "net error" }
func (e timeoutNetError) Timeout() bool   { return e.timeout }
func (e timeoutNetError) Temporary() bool { return false }

// testPolicy is the production-shaped policy with deterministic jitter (zero).
func testPolicy() retryPolicy {
	p := defaultRetryPolicy()
	p.Rand = func() float64 { return 0.5 }
	p.Sleep = func(context.Context, time.Duration) error { return nil }
	return p
}

func TestIsRetryable(t *testing.T) {
	maxDelay := 4 * time.Second
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "nil is not retryable", err: nil, want: false},
		{name: "context canceled is not retryable", err: context.Canceled, want: false},
		{name: "wrapped context canceled is not retryable", err: fmt.Errorf("fetch: %w", context.Canceled), want: false},
		{name: "HTTP 500 is retryable", err: newStatusError(http.StatusInternalServerError, 0), want: true},
		{name: "HTTP 503 is retryable", err: newStatusError(http.StatusServiceUnavailable, 0), want: true},
		{name: "HTTP 504 is retryable", err: newStatusError(http.StatusGatewayTimeout, 0), want: true},
		{name: "HTTP 429 without Retry-After is not retryable", err: newStatusError(http.StatusTooManyRequests, 0), want: false},
		{name: "HTTP 429 with a short Retry-After is retryable", err: newStatusError(http.StatusTooManyRequests, 2*time.Second), want: true},
		{name: "HTTP 429 with a Retry-After above the cap is not retryable", err: newStatusError(http.StatusTooManyRequests, 10*time.Second), want: false},
		{name: "HTTP 400 is not retryable", err: newStatusError(http.StatusBadRequest, 0), want: false},
		{name: "HTTP 401 is not retryable", err: newStatusError(http.StatusUnauthorized, 0), want: false},
		{name: "HTTP 403 is not retryable", err: newStatusError(http.StatusForbidden, 0), want: false},
		{name: "HTTP 404 is not retryable", err: newStatusError(http.StatusNotFound, 0), want: false},
		{name: "per-attempt deadline exceeded is retryable", err: fmt.Errorf("fetch: %w", context.DeadlineExceeded), want: true},
		{name: "EOF is retryable", err: fmt.Errorf("fetch: %w", io.EOF), want: true},
		{name: "unexpected EOF is retryable", err: fmt.Errorf("fetch: %w", io.ErrUnexpectedEOF), want: true},
		{name: "connection reset is retryable", err: fmt.Errorf("fetch: %w", syscall.ECONNRESET), want: true},
		{name: "network timeout is retryable", err: fmt.Errorf("fetch: %w", timeoutNetError{timeout: true}), want: true},
		{name: "non-timeout network error is not retryable", err: fmt.Errorf("fetch: %w", timeoutNetError{timeout: false}), want: false},
		{name: "unrelated error is not retryable", err: errors.New("failed to parse Gemini response"), want: false},
		{name: "word not found is not retryable", err: errWordNotFound, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, isRetryable(tt.err, maxDelay))
		})
	}
}

func TestRetryAfterOfAndStatusOf(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		wantRetryAfter time.Duration
		wantStatus     int
	}{
		{name: "reads both from a status error", err: newStatusError(http.StatusTooManyRequests, 3*time.Second), wantRetryAfter: 3 * time.Second, wantStatus: http.StatusTooManyRequests},
		{name: "reads both through wrapping", err: fmt.Errorf("x: %w", newStatusError(http.StatusServiceUnavailable, 0)), wantRetryAfter: 0, wantStatus: http.StatusServiceUnavailable},
		{name: "returns zero for a plain error", err: errors.New("boom"), wantRetryAfter: 0, wantStatus: 0},
		{name: "returns zero for nil", err: nil, wantRetryAfter: 0, wantStatus: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.wantRetryAfter, retryAfterOf(tt.err))
			assert.Equal(t, tt.wantStatus, statusOf(tt.err))
		})
	}
}

func TestBackoffDelay(t *testing.T) {
	tests := []struct {
		name       string
		attempt    int
		retryAfter time.Duration
		rand       float64
		want       time.Duration
	}{
		{name: "first attempt waits the base delay", attempt: 1, rand: 0.5, want: 500 * time.Millisecond},
		{name: "second attempt doubles", attempt: 2, rand: 0.5, want: time.Second},
		{name: "third attempt doubles again", attempt: 3, rand: 0.5, want: 2 * time.Second},
		{name: "delay is capped at the maximum", attempt: 5, rand: 0.5, want: 4 * time.Second},
		{name: "lowest jitter is minus 20 percent", attempt: 1, rand: 0, want: 400 * time.Millisecond},
		{name: "highest jitter is plus 20 percent", attempt: 1, rand: 1, want: 600 * time.Millisecond},
		{name: "jitter never pushes the delay past the cap", attempt: 5, rand: 1, want: 4 * time.Second},
		{name: "Retry-After above the computed delay wins", attempt: 1, retryAfter: 3 * time.Second, rand: 0.5, want: 3 * time.Second},
		{name: "Retry-After below the computed delay is ignored", attempt: 2, retryAfter: 100 * time.Millisecond, rand: 0.5, want: time.Second},
		{name: "Retry-After is capped at the maximum", attempt: 1, retryAfter: 30 * time.Second, rand: 0.5, want: 4 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := testPolicy()
			rand := tt.rand
			p.Rand = func() float64 { return rand }

			got := p.backoffDelay(tt.attempt, tt.retryAfter)

			assert.InDelta(t, float64(tt.want), float64(got), float64(time.Microsecond))
		})
	}
}

func TestRetryPolicySleep(t *testing.T) {
	canceledCtx, cancel := context.WithCancel(context.Background())
	cancel()
	injectedErr := errors.New("injected")

	tests := []struct {
		name    string
		ctx     context.Context
		sleep   func(context.Context, time.Duration) error
		d       time.Duration
		wantErr error
	}{
		{name: "waits for the duration then returns nil", ctx: context.Background(), d: time.Millisecond},
		{name: "returns the context error when the context ends first", ctx: canceledCtx, d: time.Minute, wantErr: context.Canceled},
		{name: "uses the injected sleep when provided", ctx: context.Background(), sleep: func(context.Context, time.Duration) error { return injectedErr }, d: time.Minute, wantErr: injectedErr},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := retryPolicy{Sleep: tt.sleep}

			err := p.sleep(tt.ctx, tt.d)

			if tt.wantErr == nil {
				assert.NoError(t, err)
				return
			}
			assert.ErrorIs(t, err, tt.wantErr)
		})
	}
}

func TestDoWithRetry(t *testing.T) {
	canceledCtx, cancel := context.WithCancel(context.Background())
	cancel()

	tests := []struct {
		name          string
		ctx           context.Context
		results       []error // per attempt; nil means the attempt succeeds
		mutatePolicy  func(*retryPolicy)
		wantAttempts  int
		wantErr       bool
		wantDelays    []time.Duration
		wantAttemptsD bool // error carries an "attempts" log detail
	}{
		{
			name:         "returns immediately when the first attempt succeeds",
			results:      []error{nil},
			wantAttempts: 1,
		},
		{
			name:         "retries once after a 503 and succeeds",
			results:      []error{newStatusError(http.StatusServiceUnavailable, 0), nil},
			wantAttempts: 2,
			wantDelays:   []time.Duration{500 * time.Millisecond},
		},
		{
			name: "backs off exponentially across consecutive failures",
			results: []error{
				newStatusError(http.StatusServiceUnavailable, 0),
				newStatusError(http.StatusServiceUnavailable, 0),
				nil,
			},
			wantAttempts: 3,
			wantDelays:   []time.Duration{500 * time.Millisecond, time.Second},
		},
		{
			name: "gives up after the maximum attempts and reports the attempt count",
			results: []error{
				newStatusError(http.StatusServiceUnavailable, 0),
				newStatusError(http.StatusServiceUnavailable, 0),
				newStatusError(http.StatusServiceUnavailable, 0),
				nil,
			},
			wantAttempts:  3,
			wantErr:       true,
			wantDelays:    []time.Duration{500 * time.Millisecond, time.Second},
			wantAttemptsD: true,
		},
		{
			name:         "does not retry a non-retryable status",
			results:      []error{newStatusError(http.StatusBadRequest, 0), nil},
			wantAttempts: 1,
			wantErr:      true,
		},
		{
			name:         "does not retry when Retry-After exceeds the maximum delay",
			results:      []error{newStatusError(http.StatusServiceUnavailable, 30*time.Second), nil},
			wantAttempts: 1,
			wantErr:      true,
		},
		{
			name:         "honours a Retry-After longer than the computed backoff",
			results:      []error{newStatusError(http.StatusServiceUnavailable, 2*time.Second), nil},
			wantAttempts: 2,
			wantDelays:   []time.Duration{2 * time.Second},
		},
		{
			name:         "stops when too little time remains for another attempt",
			results:      []error{newStatusError(http.StatusServiceUnavailable, 0), nil},
			mutatePolicy: func(p *retryPolicy) { p.TotalTimeout = 3 * time.Second },
			wantAttempts: 1,
			wantErr:      true,
		},
		{
			name:         "stops when the caller context is already canceled",
			ctx:          canceledCtx,
			results:      []error{newStatusError(http.StatusServiceUnavailable, 0), nil},
			wantAttempts: 1,
			wantErr:      true,
		},
		{
			name:    "stops when the backoff wait is interrupted",
			results: []error{newStatusError(http.StatusServiceUnavailable, 0), nil},
			mutatePolicy: func(p *retryPolicy) {
				p.Sleep = func(context.Context, time.Duration) error { return context.Canceled }
			},
			wantAttempts: 1,
			wantErr:      true,
			wantDelays:   []time.Duration{500 * time.Millisecond},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := testPolicy()
			var delays []time.Duration
			p.Sleep = func(context.Context, time.Duration) error { return nil }
			if tt.mutatePolicy != nil {
				tt.mutatePolicy(&p)
			}
			innerSleep := p.Sleep
			p.Sleep = func(ctx context.Context, d time.Duration) error {
				delays = append(delays, d)
				return innerSleep(ctx, d)
			}
			ctx := tt.ctx
			if ctx == nil {
				ctx = context.Background()
			}

			calls := 0
			op := func(attemptCtx context.Context) (string, error) {
				deadline, ok := attemptCtx.Deadline()
				require.True(t, ok, "every attempt must run under a deadline")
				assert.LessOrEqual(t, time.Until(deadline), p.AttemptTimeout)

				result := tt.results[calls]
				calls++
				if result != nil {
					return "", result
				}
				return "ok", nil
			}

			var retryNotifications int
			value, attempts, err := doWithRetry(ctx, p, op, func(int, error, time.Duration) { retryNotifications++ })

			assert.Equal(t, tt.wantAttempts, attempts)
			assert.Equal(t, tt.wantAttempts, calls)
			assert.Equal(t, len(tt.wantDelays), retryNotifications)
			if tt.wantDelays != nil {
				assert.Equal(t, tt.wantDelays, delays)
			}

			if !tt.wantErr {
				require.NoError(t, err)
				assert.Equal(t, "ok", value)
				return
			}
			require.Error(t, err)
			assert.Empty(t, value)

			var de *common.DetailedError
			require.True(t, errors.As(err, &de))
			hasAttempts := false
			for i, v := range de.LogDetail() {
				if v == "attempts" {
					hasAttempts = true
					assert.Equal(t, tt.wantAttempts, de.LogDetail()[i+1])
				}
			}
			assert.Equal(t, tt.wantAttemptsD, hasAttempts)
		})
	}
}

func TestWithAttempts(t *testing.T) {
	sentinel := errors.New("sentinel")

	tests := []struct {
		name       string
		err        error
		attempts   int
		wantSame   bool
		wantDetail []any
	}{
		{name: "returns the error unchanged for a single attempt", err: newStatusError(http.StatusBadRequest, 0), attempts: 1, wantSame: true},
		{
			name:       "appends attempts after the existing log detail",
			err:        newStatusError(http.StatusServiceUnavailable, 0),
			attempts:   3,
			wantDetail: []any{"url", "https://example.test", "attempts", 3},
		},
		{
			name:       "adds only attempts when the error has no log detail",
			err:        fmt.Errorf("fetch: %w", sentinel),
			attempts:   2,
			wantDetail: []any{"attempts", 2},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := withAttempts(tt.err, tt.attempts)

			if tt.wantSame {
				assert.Same(t, tt.err, got)
				return
			}

			assert.Equal(t, tt.err.Error(), got.Error())
			var de *common.DetailedError
			require.True(t, errors.As(got, &de))
			assert.Equal(t, tt.wantDetail, de.LogDetail())
			assert.True(t, errors.Is(got, tt.err), "the original error chain must stay discoverable")
		})
	}
}
