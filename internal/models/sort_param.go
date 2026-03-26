package models

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

// SortParam represents parsed multi-column sort parameters from a query string.
//
// Supported formats per sort item (comma-separated):
//   - Simple column:     "col" or "-col"   → ORDER BY col ASC / col DESC
//   - Expression:        "(expr)" or "-(expr)" → ORDER BY (expr) ASC / (expr) DESC
//
// A leading "-" always indicates DESC order; no prefix indicates ASC.
// Expressions are wrapped in parentheses and may contain arithmetic operators (+, -, *, /).
// Note: expressions must not contain commas (SQL functions such as COALESCE are not supported).
//
// Example:
//
//	?sort=-created_at,(count_practise*2),-(count_failure_practise/count_practise)
//	→ ORDER BY created_at DESC, (count_practise*2) ASC, (count_failure_practise/count_practise) DESC
type SortParam struct {
	items []sortItem
}

// sortItem represents a single sort directive — either a plain column or an arithmetic expression.
// raw holds the column name for plain sorts, or the expression content without outer parens for expressions.
type sortItem struct {
	raw    string
	isExpr bool
	desc   bool
}

// identifierPattern matches SQL identifiers (potential column names) within an expression.
var identifierPattern = regexp.MustCompile(`[a-zA-Z_][a-zA-Z0-9_]*`)

// ParseSortParam parses a raw sort query string value (e.g. "-status,(count_practise*2)") into a SortParam.
// Returns an error if the format is invalid (empty column names, unclosed parentheses, etc.).
func ParseSortParam(raw string) (SortParam, error) {
	if raw == "" {
		return SortParam{}, nil
	}

	parts := strings.Split(raw, ",")
	items := make([]sortItem, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			return SortParam{}, errors.New("sort parameter contains an empty entry")
		}

		desc := false
		if strings.HasPrefix(part, "-") {
			desc = true
			part = part[1:]
			if part == "" {
				return SortParam{}, errors.New("sort parameter contains an empty entry after '-'")
			}
		}

		isExpr := strings.HasPrefix(part, "(")
		var itemRaw string

		if isExpr {
			if !strings.HasSuffix(part, ")") {
				return SortParam{}, fmt.Errorf("sort expression %q is missing closing parenthesis", part)
			}
			itemRaw = part[1 : len(part)-1] // strip outer parens
			if strings.TrimSpace(itemRaw) == "" {
				return SortParam{}, errors.New("sort expression cannot be empty")
			}
		} else {
			itemRaw = part
		}

		items = append(items, sortItem{raw: itemRaw, isExpr: isExpr, desc: desc})
	}

	return SortParam{items: items}, nil
}

// IsEmpty returns true if no sort items were specified.
func (s SortParam) IsEmpty() bool {
	return len(s.items) == 0
}

// Validate checks that all column references exist in the provided allowedColumns list.
// For plain sorts, the column name is checked directly.
// For expressions, all SQL identifiers found in the expression are checked.
// Returns an error naming the first disallowed identifier found.
func (s SortParam) Validate(allowedColumns []string) error {
	allowed := make(map[string]bool, len(allowedColumns))
	for _, col := range allowedColumns {
		allowed[col] = true
	}

	for _, item := range s.items {
		if item.isExpr {
			identifiers := identifierPattern.FindAllString(item.raw, -1)
			for _, id := range identifiers {
				if !allowed[id] {
					return fmt.Errorf("column %q in sort expression %q is not allowed; allowed columns: %s",
						id, item.raw, strings.Join(allowedColumns, ", "))
				}
			}
		} else {
			if !allowed[item.raw] {
				return fmt.Errorf("sort column %q is not allowed; allowed columns: %s",
					item.raw, strings.Join(allowedColumns, ", "))
			}
		}
	}
	return nil
}

// ToOrderByClauses converts the SortParam into a []*string slice suitable for peer.Select().
// Plain sorts produce "column DESC/ASC"; expressions produce "(expr) DESC/ASC".
func (s SortParam) ToOrderByClauses() []*string {
	if s.IsEmpty() {
		return nil
	}

	clauses := make([]*string, 0, len(s.items))
	for _, item := range s.items {
		dir := "ASC"
		if item.desc {
			dir = "DESC"
		}

		var clause string
		if item.isExpr {
			clause = fmt.Sprintf("(%s) %s", item.raw, dir)
		} else {
			clause = fmt.Sprintf("%s %s", item.raw, dir)
		}
		clauses = append(clauses, &clause)
	}

	return clauses
}
