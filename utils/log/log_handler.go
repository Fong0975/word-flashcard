package log

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"path/filepath"
	"runtime"
)

// CustomHandler A custom log handler structure to logging with specific format
type CustomHandler struct {
	Writer io.Writer
	Level  slog.Leveler
}

func (h *CustomHandler) Enabled(_ context.Context, level slog.Level) bool {
	return level >= h.Level.Level()
}
func (h *CustomHandler) WithAttrs(attrs []slog.Attr) slog.Handler { return h }
func (h *CustomHandler) WithGroup(name string) slog.Handler       { return h }

func (h *CustomHandler) Handle(ctx context.Context, r slog.Record) error {
	// Format the log time
	timeStr := r.Time.Format("2006/01/02 15:04:05")

	// Get the call resource (e.g. main.go:61)
	var source string
	fs := runtime.CallersFrames([]uintptr{r.PC})
	f, _ := fs.Next()
	source = fmt.Sprintf("%s:%d", filepath.Base(f.File), f.Line)

	// Collect attributes
	var attrs []string
	r.Attrs(func(a slog.Attr) bool {
		attrs = append(attrs, fmt.Sprintf("%s=%v", a.Key, a.Value))
		return true
	})

	// Compose the log line (time | level | source | message | attributes)
	message := r.Message
	if len(attrs) > 0 {
		attrStr := ""
		for i, attr := range attrs {
			if i > 0 {
				attrStr += ", "
			}
			attrStr += attr
		}
		message = fmt.Sprintf("%s [%s]", r.Message, attrStr)
	}

	logLine := fmt.Sprintf("%s | %s | %s | %s\n",
		timeStr,
		r.Level.String(),
		source,
		message,
	)

	_, err := h.Writer.Write([]byte(logLine))
	return err
}
