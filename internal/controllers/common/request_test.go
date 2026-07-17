package common

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// RequestHelperTestSuite is a test suite for request parsing helper functions
type RequestHelperTestSuite struct {
	suite.Suite
}

// TestRequestHelperTestSuite runs the RequestHelperTestSuite
func TestRequestHelperTestSuite(t *testing.T) {
	suite.Run(t, new(RequestHelperTestSuite))
}

// newRequestTestContext builds a gin.Context backed by a real *http.Request so
// path/query parsing helpers can be exercised directly.
func newRequestTestContext(method, target string, body io.Reader, params gin.Params) *gin.Context {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(method, target, body)
	ctx.Params = params
	return ctx
}

// TestParseIDFromPath tests ParseIDFromPath across a valid id and the invalid
// shapes it must reject: non-numeric, zero, and negative.
func (suite *RequestHelperTestSuite) TestParseIDFromPath() {
	testCases := []struct {
		name       string
		paramValue string
		wantErr    bool
		wantID     int
	}{
		{name: "valid positive id", paramValue: "42", wantID: 42},
		{name: "non-numeric id", paramValue: "abc", wantErr: true},
		{name: "zero id", paramValue: "0", wantErr: true},
		{name: "negative id", paramValue: "-1", wantErr: true},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := newRequestTestContext(http.MethodGet, "/api/words/"+tc.paramValue, nil, gin.Params{{Key: "id", Value: tc.paramValue}})

			id, err := ParseIDFromPath(ctx, "id")

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantID, id)
			}
		})
	}
}

// TestParseLimitAndOffsetFromPath tests the default values, explicit values,
// and the limit/offset validation rules (limit in [0, 1000], offset >= 0).
func (suite *RequestHelperTestSuite) TestParseLimitAndOffsetFromPath() {
	testCases := []struct {
		name       string
		query      string
		wantErr    bool
		wantLimit  int
		wantOffset int
	}{
		{name: "defaults when absent", query: "", wantLimit: 100, wantOffset: 0},
		{name: "explicit values", query: "?limit=20&offset=10", wantLimit: 20, wantOffset: 10},
		{name: "limit exceeds max", query: "?limit=1001", wantErr: true},
		{name: "negative offset", query: "?offset=-1", wantErr: true},
		{name: "non-numeric limit", query: "?limit=abc", wantErr: true},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := newRequestTestContext(http.MethodGet, "/api/words"+tc.query, nil, nil)

			limit, offset, err := ParseLimitAndOffsetFromPath(ctx)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantLimit, limit)
				suite.Equal(tc.wantOffset, offset)
			}
		})
	}
}

// TestParseIntQueryParam tests the default-value fallback, an explicit value,
// and a malformed value.
func (suite *RequestHelperTestSuite) TestParseIntQueryParam() {
	testCases := []struct {
		name    string
		query   string
		wantErr bool
		want    int
	}{
		{name: "absent uses default", query: "", want: 30},
		{name: "explicit value", query: "?days=7", want: 7},
		{name: "non-numeric value", query: "?days=abc", wantErr: true},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := newRequestTestContext(http.MethodGet, "/api/words/trend"+tc.query, nil, nil)

			got, err := ParseIntQueryParam(ctx, "days", 30)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.want, got)
			}
		})
	}
}

// TestParseRequestBody tests the no-op paths (empty body, empty "{}" body),
// a successful bind, and a malformed-JSON error.
func (suite *RequestHelperTestSuite) TestParseRequestBody() {
	type payload struct {
		Name string `json:"name"`
	}

	testCases := []struct {
		name     string
		body     string
		wantErr  bool
		wantName string
	}{
		{name: "empty body is a no-op", body: "", wantName: ""},
		{name: "empty JSON object is a no-op", body: "{}", wantName: ""},
		{name: "valid body binds to target", body: `{"name":"foo"}`, wantName: "foo"},
		{name: "malformed JSON returns error", body: `{`, wantErr: true},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			var body io.Reader
			if tc.body != "" {
				body = bytes.NewReader([]byte(tc.body))
			}
			ctx := newRequestTestContext(http.MethodPost, "/api/words", body, nil)

			var obj payload
			err := ParseRequestBody(&obj, ctx)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantName, obj.Name)
			}
		})
	}
}
