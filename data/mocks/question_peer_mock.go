package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockQuestionPeer is a mock implementation for QuestionPeer
type MockQuestionPeer struct {
	mock.Mock
}

// MockQuestionPeer_Expecter is an expecter for MockQuestionPeer
type MockQuestionPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockQuestionPeer creates a new mock QuestionPeer instance
func NewMockQuestionPeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockQuestionPeer {
	mockPeer := &MockQuestionPeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockQuestionPeer) EXPECT() *MockQuestionPeer_Expecter {
	return &MockQuestionPeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockQuestionPeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockQuestionPeer_Expecter) Insert(question interface{}) *mock.Call {
	return _e.mock.On("Insert", question)
}

// Update expecter method
func (_e *MockQuestionPeer_Expecter) Update(question interface{}, where interface{}) *mock.Call {
	return _e.mock.On("Update", question, where)
}

// Delete expecter method
func (_e *MockQuestionPeer_Expecter) Delete(where interface{}) *mock.Call {
	return _e.mock.On("Delete", where)
}

// Select mock implementation
func (_m *MockQuestionPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Question, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.Question
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.Question); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.Question)
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
func (_m *MockQuestionPeer) Insert(question *models.Question) (int64, error) {
	ret := _m.Called(question)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Question) int64); ok {
		r0 = rf(question)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Question) error); ok {
		r1 = rf(question)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Update mock implementation
func (_m *MockQuestionPeer) Update(question *models.Question, where squirrel.Sqlizer) (int64, error) {
	ret := _m.Called(question, where)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Question, squirrel.Sqlizer) int64); ok {
		r0 = rf(question, where)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Question, squirrel.Sqlizer) error); ok {
		r1 = rf(question, where)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Delete mock implementation
func (_m *MockQuestionPeer) Delete(where squirrel.Sqlizer) (int64, error) {
	ret := _m.Called(where)

	var r0 int64
	if rf, ok := ret.Get(0).(func(squirrel.Sqlizer) int64); ok {
		r0 = rf(where)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(squirrel.Sqlizer) error); ok {
		r1 = rf(where)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}
