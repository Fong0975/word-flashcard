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

// timeParamLayouts are tried in order when parsing a "from"/"to" bound.
var timeParamLayouts = []string{
	time.RFC3339,
	"2006-01-02T15:04:05",
	dateOnlyLayout,
}

// ParseFilterParams builds a Filter from the ?level, ?from and ?to query
// parameters. All three are optional; an absent parameter imposes no
// constraint.
//
//	level   comma-separated level names, e.g. "WARN,ERROR"
//	from/to inclusive bounds, as RFC3339 or a plain date
func ParseFilterParams(c *gin.Context) (Filter, error) {
	filter := Filter{Levels: parseLevelsParam(c.Query("level"))}

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
// A date-only value used as an upper bound is stretched to the end of that
// day: "to=2026-08-30" is meant to include the 30th, but parsing it plainly
// would yield midnight and exclude the entire day.
func parseTimeParam(value string, upperBound bool) (*time.Time, error) {
	if value = strings.TrimSpace(value); value == "" {
		return nil, nil
	}

	for _, layout := range timeParamLayouts {
		parsed, err := time.ParseInLocation(layout, value, time.Local)
		if err != nil {
			continue
		}

		if upperBound && layout == dateOnlyLayout {
			parsed = parsed.Add(24*time.Hour - time.Nanosecond)
		}

		return &parsed, nil
	}

	return nil, errors.New("unrecognised time format: " + value)
}
