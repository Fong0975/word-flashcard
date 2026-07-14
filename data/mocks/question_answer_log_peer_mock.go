package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockQuestionAnswerLogPeer is a mock implementation for QuestionAnswerLogPeer
type MockQuestionAnswerLogPeer struct {
	mock.Mock
}

// MockQuestionAnswerLogPeer_Expecter is an expecter for MockQuestionAnswerLogPeer
type MockQuestionAnswerLogPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockQuestionAnswerLogPeer creates a new mock QuestionAnswerLogPeer instance
func NewMockQuestionAnswerLogPeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockQuestionAnswerLogPeer {
	mockPeer := &MockQuestionAnswerLogPeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockQuestionAnswerLogPeer) EXPECT() *MockQuestionAnswerLogPeer_Expecter {
	return &MockQuestionAnswerLogPeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockQuestionAnswerLogPeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockQuestionAnswerLogPeer_Expecter) Insert(log interface{}) *mock.Call {
	return _e.mock.On("Insert", log)
}

// Select mock implementation
func (_m *MockQuestionAnswerLogPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.QuestionAnswerLog, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.QuestionAnswerLog
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.QuestionAnswerLog); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.QuestionAnswerLog)
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
func (_m *MockQuestionAnswerLogPeer) Insert(log *models.QuestionAnswerLog) (int64, error) {
	ret := _m.Called(log)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.QuestionAnswerLog) int64); ok {
		r0 = rf(log)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.QuestionAnswerLog) error); ok {
		r1 = rf(log)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}
