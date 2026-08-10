package mocks

import (
	"word-flashcard/data/peers"

	"github.com/stretchr/testify/mock"
)

// MockBackupPeer is a mock implementation for BackupPeer
type MockBackupPeer struct {
	mock.Mock
}

// MockBackupPeer_Expecter is an expecter for MockBackupPeer
type MockBackupPeer_Expecter struct {
	mock *mock.Mock
}

// NewMockBackupPeer creates a new mock BackupPeer instance
func NewMockBackupPeer(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockBackupPeer {
	mockPeer := &MockBackupPeer{}
	mockPeer.Mock.Test(t)

	t.Cleanup(func() { mockPeer.AssertExpectations(t) })

	return mockPeer
}

func (_m *MockBackupPeer) EXPECT() *MockBackupPeer_Expecter {
	return &MockBackupPeer_Expecter{mock: &_m.Mock}
}

// RestoreAll expecter method
func (_e *MockBackupPeer_Expecter) RestoreAll(payload interface{}) *mock.Call {
	return _e.mock.On("RestoreAll", payload)
}

// RestoreAll mock implementation
func (_m *MockBackupPeer) RestoreAll(payload *peers.RestorePayload) error {
	ret := _m.Called(payload)

	var r0 error
	if rf, ok := ret.Get(0).(func(*peers.RestorePayload) error); ok {
		r0 = rf(payload)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}
