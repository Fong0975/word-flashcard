// Package common: timezone helpers used by trend/report endpoints to bucket
// timestamps into calendar days, independent of the timezone the data is
// stored/parsed in (UTC) or the server process's own local timezone.
package common

import (
	"fmt"
	"time"
)

// ReportTimeZone is the single IANA timezone name used to bucket calendar
// days for trend/report endpoints (e.g. daily trend charts). Changing the
// reporting timezone in the future only requires updating this constant.
const ReportTimeZone = "Asia/Taipei"

// reportLocation is resolved once at package init since ReportTimeZone is a
// fixed constant; a failure here means the timezone database is unavailable
// in the running environment, which is a startup-time configuration problem
// rather than something a single request can recover from.
var reportLocation = mustLoadLocation(ReportTimeZone)

func mustLoadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic(fmt.Sprintf("common: failed to load timezone %q: %v", name, err))
	}
	return loc
}

// NowInReportTimeZone returns the current time in ReportTimeZone, so trend
// endpoints compute "today" using the same calendar day report viewers see,
// regardless of the timezone the server process itself runs in.
func NowInReportTimeZone() time.Time {
	return time.Now().In(reportLocation)
}

// ReportDateKey formats t as a "YYYY-MM-DD" key in ReportTimeZone, so daily
// aggregation buckets by the calendar day report viewers expect instead of
// whichever timezone t happens to be stored/parsed in (e.g. UTC).
func ReportDateKey(t time.Time) string {
	return t.In(reportLocation).Format("2006-01-02")
}
