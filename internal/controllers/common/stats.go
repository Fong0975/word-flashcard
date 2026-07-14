// Package common holds statistics helpers shared across multiple controllers
// (e.g. word and question stats endpoints), so the bucketing logic doesn't
// live inside a single entity's helper file despite being entity-agnostic.
package common

import (
	"fmt"
	"math"
	"time"

	"word-flashcard/internal/models"
)

// niceCeil returns the smallest "nice" number (1/2/5 × 10^n) that is >= x.
func niceCeil(x float64) int {
	if x <= 1 {
		return 1
	}
	exp := math.Floor(math.Log10(x))
	base := math.Pow(10, exp)
	f := x / base
	for _, n := range []float64{1, 2, 5, 10} {
		if n >= f-1e-9 {
			return int(n * base)
		}
	}
	return int(10 * base)
}

// practiceCountBoundaries returns exclusive upper bounds for practice count
// histogram buckets. Each eus[i] is the exclusive upper bound of the (i+1)th
// non-zero bucket; the last element is the start of the open-ended tail bucket.
// Returns nil when maxCP == 0 (only the "0" bucket is needed).
func practiceCountBoundaries(maxCP int) []int {
	if maxCP == 0 {
		return nil
	}
	if maxCP <= 6 {
		// Individual integer steps: eus = [2, 3, ..., maxCP, maxCP+1]
		eus := make([]int, maxCP)
		for i := range eus {
			eus[i] = i + 2
		}
		return eus
	}
	// ~5 log-spaced splits rounded to nice numbers, plus the tail marker.
	const n = 5
	logMax := math.Log(float64(maxCP + 1))
	step := logMax / float64(n+1)
	eus := make([]int, 0, n+1)
	for i := 1; i <= n; i++ {
		nice := niceCeil(math.Exp(float64(i) * step))
		if nice > maxCP {
			break
		}
		if len(eus) == 0 || nice > eus[len(eus)-1] {
			eus = append(eus, nice)
		}
	}
	return append(eus, maxCP+1)
}

// BuildPracticeCountBuckets partitions counts into dynamically sized histogram
// buckets. The zero bucket is always separate; remaining buckets use log-spaced
// nice-number boundaries so the chart stays readable whether the max is 5 or 5000.
func BuildPracticeCountBuckets(counts []int) []models.PracticeCountBucket {
	maxCP := 0
	for _, c := range counts {
		if c > maxCP {
			maxCP = c
		}
	}

	eus := practiceCountBoundaries(maxCP)

	// Build [{lo, hi}] pairs from eus; hi == -1 means open-ended.
	type bound struct{ lo, hi int }
	defs := make([]bound, 0, len(eus)+1)
	defs = append(defs, bound{0, 0})
	prev := 1
	for i, eu := range eus {
		if i == len(eus)-1 {
			defs = append(defs, bound{prev, -1})
		} else {
			defs = append(defs, bound{prev, eu - 1})
			prev = eu
		}
	}
	if len(eus) == 0 && maxCP > 0 {
		defs = append(defs, bound{1, -1})
	}

	// Assign labels.
	buckets := make([]models.PracticeCountBucket, len(defs))
	for i, d := range defs {
		var label string
		switch {
		case d.hi == 0:
			label = "0"
		case d.hi == -1:
			label = fmt.Sprintf("%d+", d.lo)
		case d.lo == d.hi:
			label = fmt.Sprintf("%d", d.lo)
		default:
			label = fmt.Sprintf("%d ~ %d", d.lo, d.hi)
		}
		buckets[i] = models.PracticeCountBucket{Range: label}
	}

	// Count each value into its bucket.
	for _, c := range counts {
		for i, d := range defs {
			if (d.hi == -1 && c >= d.lo) || (d.hi >= 0 && c >= d.lo && c <= d.hi) {
				buckets[i].Count++
				break
			}
		}
	}

	return buckets
}

// DailyDateKeys returns `days` ascending "YYYY-MM-DD" date keys, the most
// recent one being now's calendar day, so trend endpoints can zero-fill days
// with no activity instead of omitting them from the response.
func DailyDateKeys(days int, now time.Time) []string {
	keys := make([]string, days)
	for i := days - 1; i >= 0; i-- {
		keys[days-1-i] = now.AddDate(0, 0, -i).Format("2006-01-02")
	}
	return keys
}

// Round1 rounds f to 1 decimal place, used to keep trend/average values
// stable and readable across controller responses.
func Round1(f float64) float64 { return math.Round(f*10) / 10 }
