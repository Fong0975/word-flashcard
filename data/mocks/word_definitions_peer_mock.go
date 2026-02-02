package mocks

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// MockWordDefinitionsPeer is a mock implementation for WordDefinitionsPeer
type MockWordDefinitionsPeer struct {
	mock.Mock
}

// MockWordDefinitionsPeer_Expecter is an expecter for MockWordDefinitionsPeer
type MockWordDefinitionsPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockWordDefinitionsPeer creates a new mock WordDefinitionsPeer instance
func NewMockWordDefinitionsPeer(t interface {
	mock.TestingT
}) *MockWordDefinitionsPeer {
	mockPeer := &MockWordDefinitionsPeer{}
	mockPeer.Mock.Test(t)

	return mockPeer
}

func (_m *MockWordDefinitionsPeer) EXPECT() *MockWordDefinitionsPeer_Expecter {
	return &MockWordDefinitionsPeer_Expecter{mock: &_m.Mock}
}

// Select expecter method
func (_e *MockWordDefinitionsPeer_Expecter) Select(columns interface{}, where interface{}, orderBy interface{}, limit interface{}, offset interface{}) *mock.Call {
	return _e.mock.On("Select", columns, where, orderBy, limit, offset)
}

// Insert expecter method
func (_e *MockWordDefinitionsPeer_Expecter) Insert(definition interface{}) *mock.Call {
	return _e.mock.On("Insert", definition)
}

// Update expecter method
func (_e *MockWordDefinitionsPeer_Expecter) Update(definition interface{}, where interface{}) *mock.Call {
	return _e.mock.On("Update", definition, where)
}

// Delete expecter method
func (_e *MockWordDefinitionsPeer_Expecter) Delete(where interface{}) *mock.Call {
	return _e.mock.On("Delete", where)
}

// Select mock implementation
func (_m *MockWordDefinitionsPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordDefinition, error) {
	ret := _m.Called(columns, where, orderBy, limit, offset)

	var r0 []*models.WordDefinition
	if rf, ok := ret.Get(0).(func([]*string, squirrel.Sqlizer, []*string, *uint64, *uint64) []*models.WordDefinition); ok {
		r0 = rf(columns, where, orderBy, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.WordDefinition)
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
func (_m *MockWordDefinitionsPeer) Insert(definition *models.WordDefinition) (int64, error) {
	ret := _m.Called(definition)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.WordDefinition) int64); ok {
		r0 = rf(definition)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.WordDefinition) error); ok {
		r1 = rf(definition)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Update mock implementation
func (_m *MockWordDefinitionsPeer) Update(definition *models.WordDefinition, where squirrel.Sqlizer) (int64, error) {
	ret := _m.Called(definition, where)

	var r0 int64
	if rf, ok := ret.Get(0).(func(*models.WordDefinition, squirrel.Sqlizer) int64); ok {
		r0 = rf(definition, where)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(*models.WordDefinition, squirrel.Sqlizer) error); ok {
		r1 = rf(definition, where)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Delete mock implementation
func (_m *MockWordDefinitionsPeer) Delete(where squirrel.Sqlizer) (int64, error) {
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
