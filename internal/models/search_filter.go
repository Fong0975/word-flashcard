package models

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/Masterminds/squirrel"
)

// ErrorResponse represents a standard error response structure for all APIs
type ErrorResponse struct {
	Error string `json:"error"`
}

// SearchCondition represents a single search condition (key-operator-value)
type SearchCondition struct {
	Key      string `json:"key" binding:"required"`
	Operator string `json:"operator" binding:"required"`
	Value    string `json:"value" binding:"required"`
}

// SearchFilter supports multiple conditions search with logic operator
type SearchFilter struct {
	Conditions []SearchCondition `json:"conditions" binding:"required,min=1"`
	Logic      string            `json:"logic" binding:"required"` // "AND" or "OR"
}

func (s SearchFilter) IsEmpty() bool {
	return len(s.Conditions) == 0
}

// ToSqlizer converts the SearchFilter to squirrel.Sqlizer with logic operator support
func (s SearchFilter) ToSqlizer() (squirrel.Sqlizer, error) {
	if s.IsEmpty() {
		return nil, nil
	}

	// Validate logic operator
	logic := strings.ToUpper(s.Logic)
	if logic != "AND" && logic != "OR" {
		return nil, errors.New("logic operator must be 'AND' or 'OR'")
	}

	// Convert each condition to Sqlizer
	var conditions []squirrel.Sqlizer
	for i, condition := range s.Conditions {
		sqlizer, err := convertConditionToSqlizer(&condition)
		if err != nil {
			return nil, fmt.Errorf("condition %d: %s", i+1, err.Error())
		}
		conditions = append(conditions, sqlizer)
	}

	// Combine conditions based on logic operator
	if len(conditions) == 1 {
		return conditions[0], nil
	}

	if logic == "AND" {
		return squirrel.And(conditions), nil
	} else {
		return squirrel.Or(conditions), nil
	}
}

// convertConditionToSqlizer converts a single SearchCondition to squirrel.Sqlizer
// This is adapted from controllers.ConvertFilterToSqlizer logic
func convertConditionToSqlizer(condition *SearchCondition) (squirrel.Sqlizer, error) {
	if condition == nil {
		return nil, nil
	}

	// Validate required fields
	if condition.Key == "" {
		return nil, errors.New("condition key cannot be empty")
	}
	if condition.Operator == "" {
		return nil, errors.New("condition operator cannot be empty")
	}

	switch condition.Operator {
	case "equal", "eq":
		// Equal operation: column = value
		if condition.Value == "" {
			return nil, errors.New("condition value cannot be empty for equal operation")
		}
		return squirrel.Eq{condition.Key: condition.Value}, nil

	case "not_equal", "ne", "neq":
		// Not equal operation: column != value
		if condition.Value == "" {
			return nil, errors.New("condition value cannot be empty for not_equal operation")
		}
		return squirrel.NotEq{condition.Key: condition.Value}, nil

	case "in":
		// In operation: column IN (value1, value2, ...)
		// Value should be a JSON array string
		return parseArrayCondition(condition.Key, condition.Value, false)

	case "not_in", "nin":
		// Not in operation: column NOT IN (value1, value2, ...)
		// Value should be a JSON array string
		return parseArrayCondition(condition.Key, condition.Value, true)

	case "like":
		// Like operation: column LIKE pattern
		if condition.Value == "" {
			return nil, errors.New("condition value cannot be empty for like operation")
		}
		return squirrel.Like{condition.Key: condition.Value}, nil

	case "not_like", "nlike":
		// Not like operation: column NOT LIKE pattern
		if condition.Value == "" {
			return nil, errors.New("condition value cannot be empty for not_like operation")
		}
		return squirrel.NotLike{condition.Key: condition.Value}, nil

	default:
		return nil, errors.New("unsupported operator: " + condition.Operator + ". Supported operators: equal/eq, not_equal/ne/neq, in, not_in/nin, like, not_like/nlike")
	}
}

// parseArrayCondition parses the condition value as JSON array and creates appropriate squirrel condition
func parseArrayCondition(key, value string, isNotIn bool) (squirrel.Sqlizer, error) {
	if value == "" {
		return nil, errors.New("condition value cannot be empty for array operations")
	}

	// Parse JSON array
	var values []interface{}
	if err := json.Unmarshal([]byte(value), &values); err != nil {
		return nil, errors.New("condition value must be a valid JSON array for array operations: " + err.Error())
	}

	// Validate array is not empty
	if len(values) == 0 {
		return nil, errors.New("condition value array cannot be empty for array operations")
	}

	// Create appropriate condition
	if isNotIn {
		return squirrel.NotEq{key: values}, nil
	}
	return squirrel.Eq{key: values}, nil
}
