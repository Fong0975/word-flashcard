package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockWordPeer is a mock implementation for WordPeer
type MockWordPeer struct {
	mock.Mock
}

// MockWordPeer_Expecter is an expecter for MockWordPeer
type MockWordPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockWordPeer creates a new mock WordPeer instance
func NewMockWordPeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockWordPeer {
	mockPeer := &MockWordPeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockWordPeer) EXPECT() *MockWordPeer_Expecter {
	return &MockWordPeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockWordPeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockWordPeer_Expecter) Insert(word interface{}) *mock.Call {
	return _e.mock.On("Insert", word)
}

// Update expecter method
func (_e *MockWordPeer_Expecter) Update(word interface{}, where interface{}) *mock.Call {
	return _e.mock.On("Update", word, where)
}

// Delete expecter method
func (_e *MockWordPeer_Expecter) Delete(where interface{}) *mock.Call {
	return _e.mock.On("Delete", where)
}

// Count expecter method
func (_e *MockWordPeer_Expecter) Count(where interface{}) *mock.Call {
	return _e.mock.On("Count", where)
}

// Select mock implementation
func (_m *MockWordPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.Word
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.Word); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.Word)
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
func (_m *MockWordPeer) Insert(word *models.Word) (int64, error) {
	ret := _m.Called(word)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Word) int64); ok {
		r0 = rf(word)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Word) error); ok {
		r1 = rf(word)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Update mock implementation
func (_m *MockWordPeer) Update(word *models.Word, where squirrel.Sqlizer) (int64, error) {
	ret := _m.Called(word, where)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Word, squirrel.Sqlizer) int64); ok {
		r0 = rf(word, where)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Word, squirrel.Sqlizer) error); ok {
		r1 = rf(word, where)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Delete mock implementation
func (_m *MockWordPeer) Delete(where squirrel.Sqlizer) (int64, error) {
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

// Count mock implementation
func (_m *MockWordPeer) Count(where squirrel.Sqlizer) (int64, error) {
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
