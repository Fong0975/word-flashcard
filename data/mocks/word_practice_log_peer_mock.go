package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockWordPracticeLogPeer is a mock implementation for WordPracticeLogPeer
type MockWordPracticeLogPeer struct {
	mock.Mock
}

// MockWordPracticeLogPeer_Expecter is an expecter for MockWordPracticeLogPeer
type MockWordPracticeLogPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockWordPracticeLogPeer creates a new mock WordPracticeLogPeer instance
func NewMockWordPracticeLogPeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockWordPracticeLogPeer {
	mockPeer := &MockWordPracticeLogPeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockWordPracticeLogPeer) EXPECT() *MockWordPracticeLogPeer_Expecter {
	return &MockWordPracticeLogPeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockWordPracticeLogPeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockWordPracticeLogPeer_Expecter) Insert(log interface{}) *mock.Call {
	return _e.mock.On("Insert", log)
}

// Select mock implementation
func (_m *MockWordPracticeLogPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordPracticeLog, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.WordPracticeLog
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.WordPracticeLog); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.WordPracticeLog)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) error); ok {
		r1 = rf(columns, where, orderBy, limit, offset)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Insert mock implementation
func (_m *MockWordPracticeLogPeer) Insert(log *models.WordPracticeLog) (int64, error) {
	ret := _m.Called(log)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.WordPracticeLog) int64); ok {
		r0 = rf(log)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.WordPracticeLog) error); ok {
		r1 = rf(log)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}
