package models

// WordFamiliarityDistribution holds the count for each familiarity level
type WordFamiliarityDistribution struct {
	Red    int64 `json:"red"`
	Yellow int64 `json:"yellow"`
	Green  int64 `json:"green"`
}

// PracticeCountBucket holds the word count for a given practice count range
type PracticeCountBucket struct {
	Range string `json:"range"`
	Count int    `json:"count"`
}

// WordStats is the response for the word statistics endpoint
type WordStats struct {
	FamiliarityDistribution   WordFamiliarityDistribution `json:"familiarity_distribution"`
	PracticeCountDistribution []PracticeCountBucket       `json:"practice_count_distribution"`
}

// AccuracyBucket holds the question count for a given accuracy range, along
// with a breakdown of those questions by how many times they were practiced.
type AccuracyBucket struct {
	Range                  string                `json:"range"`
	Count                  int                   `json:"count"`
	PracticeCountBreakdown []PracticeCountBucket `json:"practice_count_breakdown"`
}

// QuestionStats is the response for the question statistics endpoint
type QuestionStats struct {
	AccuracyDistribution []AccuracyBucket `json:"accuracy_distribution"`
}
