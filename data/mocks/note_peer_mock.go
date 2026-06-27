package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockNotePeer is a mock implementation for NotePeer
type MockNotePeer struct {
	mock.Mock
}

// MockNotePeer_Expecter is an expecter for MockNotePeer
type MockNotePeer_Expecter struct {
	mock *mock.Mock
}

// NewMockNotePeer creates a new mock NotePeer instance
func NewMockNotePeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockNotePeer {
	mockPeer := &MockNotePeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockNotePeer) EXPECT() *MockNotePeer_Expecter {
	return &MockNotePeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockNotePeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockNotePeer_Expecter) Insert(note interface{}) *mock.Call {
	return _e.mock.On("Insert", note)
}

// Update expecter method
func (_e *MockNotePeer_Expecter) Update(note interface{}, where interface{}) *mock.Call {
	return _e.mock.On("Update", note, where)
}

// Delete expecter method
func (_e *MockNotePeer_Expecter) Delete(where interface{}) *mock.Call {
	return _e.mock.On("Delete", where)
}

// Count expecter method
func (_e *MockNotePeer_Expecter) Count() *mock.Call {
	return _e.mock.On("Count")
}

// Select mock implementation
func (_m *MockNotePeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Note, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.Note
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.Note); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.Note)
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
func (_m *MockNotePeer) Insert(note *models.Note) (int64, error) {
	ret := _m.Called(note)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Note) int64); ok {
		r0 = rf(note)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Note) error); ok {
		r1 = rf(note)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Update mock implementation
func (_m *MockNotePeer) Update(note *models.Note, where squirrel.Sqlizer) (int64, error) {
	ret := _m.Called(note, where)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.Note, squirrel.Sqlizer) int64); ok {
		r0 = rf(note, where)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.Note, squirrel.Sqlizer) error); ok {
		r1 = rf(note, where)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Delete mock implementation
func (_m *MockNotePeer) Delete(where squirrel.Sqlizer) (int64, error) {
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
func (_m *MockNotePeer) Count() (int64, error) {
	ret := _m.Called()

	var r0 int64
	if rf, ok := ret.Get(0).(func() int64); ok {
		r0 = rf()
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func() error); ok {
		r1 = rf()
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}
