package logs

import (
	"errors"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// dateOnlyLayout is the format an <input type="date"> submits. Accepting it
// alongside full timestamps is what lets the frontend's date pickers be
// passed straight through.
const dateOnlyLayout = "2006-01-02"

// dateTimeMinuteLayout is the format an <input type="datetime-local">
// submits when its step leaves seconds off (the default), e.g.
// "2026-08-30T14:30".
const dateTimeMinuteLayout = "2006-01-02T15:04"

// timeParamLayouts are tried in order when parsing a "from"/"to" bound.
var timeParamLayouts = []string{
	time.RFC3339,
	"2006-01-02T15:04:05",
	dateTimeMinuteLayout,
	dateOnlyLayout,
}

// coarseLayoutSpans maps a layout coarser than one second to the span of
// time it represents. An inclusive upper bound parsed with one of these is
// stretched to the end of that span rather than landing on its first
// instant -- e.g. "to=2026-08-30" is meant to include the whole day, and
// "to=2026-08-30T14:30" (a datetime-local value with no seconds) is meant
// to include that whole minute.
var coarseLayoutSpans = map[string]time.Duration{
	dateTimeMinuteLayout: time.Minute,
	dateOnlyLayout:       24 * time.Hour,
}

// ParseFilterParams builds a Filter from the ?level, ?from, ?to and
// ?keyword query parameters. All are optional; an absent parameter imposes
// no constraint.
//
//	level   comma-separated level names, e.g. "WARN,ERROR"
//	from/to inclusive bounds, as RFC3339, a datetime-local value, or a plain
//	        date
//	keyword case-insensitive substring match against message or source
func ParseFilterParams(c *gin.Context) (Filter, error) {
	filter := Filter{
		Levels:  parseLevelsParam(c.Query("level")),
		Keyword: strings.TrimSpace(c.Query("keyword")),
	}

	from, err := parseTimeParam(c.Query("from"), false)
	if err != nil {
		return Filter{}, errors.New("invalid from parameter")
	}
	filter.From = from

	to, err := parseTimeParam(c.Query("to"), true)
	if err != nil {
		return Filter{}, errors.New("invalid to parameter")
	}
	filter.To = to

	return filter, nil
}

// parseLevelsParam splits a comma-separated level list, dropping blanks so
// that "?level=" and a trailing comma both mean "no level constraint".
func parseLevelsParam(value string) []string {
	var levels []string
	for _, level := range strings.Split(value, ",") {
		if level = strings.TrimSpace(level); level != "" {
			levels = append(levels, level)
		}
	}

	return levels
}

// parseTimeParam parses one bound, returning nil for an empty value.
//
// A value parsed with a layout coarser than one second is, as an upper
// bound, stretched to the end of that span rather than its first instant --
// see coarseLayoutSpans.
func parseTimeParam(value string, upperBound bool) (*time.Time, error) {
	if value = strings.TrimSpace(value); value == "" {
		return nil, nil
	}

	for _, layout := range timeParamLayouts {
		parsed, err := time.ParseInLocation(layout, value, time.Local)
		if err != nil {
			continue
		}

		if upperBound {
			if span, ok := coarseLayoutSpans[layout]; ok {
				parsed = parsed.Add(span - time.Nanosecond)
			}
		}

		return &parsed, nil
	}

	return nil, errors.New("unrecognised time format: " + value)
}
