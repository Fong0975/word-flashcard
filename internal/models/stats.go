package models

// WordFamiliarityDistribution holds the count for each familiarity level
type WordFamiliarityDistribution struct {
	Red    int64 `json:"red"`
	Yellow int64 `json:"yellow"`
	Green  int64 `json:"green"`
}

// WordStats is the response for the word statistics endpoint
type WordStats struct {
	FamiliarityDistribution WordFamiliarityDistribution `json:"familiarity_distribution"`
}

// AccuracyBucket holds the question count for a given accuracy range
type AccuracyBucket struct {
	Range string `json:"range"`
	Count int    `json:"count"`
}

// QuestionStats is the response for the question statistics endpoint
type QuestionStats struct {
	AccuracyDistribution []AccuracyBucket `json:"accuracy_distribution"`
}
