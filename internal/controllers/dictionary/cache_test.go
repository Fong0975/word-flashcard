package dictionary

import "time"

// TestGetFromCacheMiss tests that a missing key returns nil
func (suite *ControllerTestSuite) TestGetFromCacheMiss() {
	result := suite.controller.getFromCache("missing-key")

	suite.Nil(result)
}

// TestGetFromCacheHit tests that a fresh cache entry is returned
func (suite *ControllerTestSuite) TestGetFromCacheHit() {
	suite.controller.cache["hello"] = CacheEntry{
		Data:      "cached-value",
		Timestamp: time.Now(),
	}

	result := suite.controller.getFromCache("hello")

	suite.Equal("cached-value", result)
}

// TestGetFromCacheExpired tests that an expired entry is evicted and returns nil
func (suite *ControllerTestSuite) TestGetFromCacheExpired() {
	suite.controller.cache["hello"] = CacheEntry{
		Data:      "stale-value",
		Timestamp: time.Now().Add(-suite.controller.cacheTTL - time.Minute),
	}

	result := suite.controller.getFromCache("hello")

	suite.Nil(result)
	_, exists := suite.controller.cache["hello"]
	suite.False(exists, "expired entry should be evicted from the cache")
}

// TestSetCacheStoresEntry tests that setCache stores the value with a fresh timestamp
func (suite *ControllerTestSuite) TestSetCacheStoresEntry() {
	suite.controller.setCache("hello", "new-value")

	entry, exists := suite.controller.cache["hello"]
	suite.True(exists)
	suite.Equal("new-value", entry.Data)
	suite.WithinDuration(time.Now(), entry.Timestamp, time.Second)
}

// TestSetCacheCleansUpExpiredEntriesOnOverflow tests that setCache purges expired
// entries once the cache grows beyond 1000 entries, while fresh entries survive.
func (suite *ControllerTestSuite) TestSetCacheCleansUpExpiredEntriesOnOverflow() {
	expiredTimestamp := time.Now().Add(-suite.controller.cacheTTL - time.Minute)
	for i := range 1000 {
		suite.controller.cache[string(rune(i))] = CacheEntry{
			Data:      i,
			Timestamp: expiredTimestamp,
		}
	}
	suite.controller.cache["fresh"] = CacheEntry{
		Data:      "fresh-value",
		Timestamp: time.Now(),
	}
	suite.Len(suite.controller.cache, 1001)

	// Triggers the len(dc.cache) > 1000 cleanup branch.
	suite.controller.setCache("new-key", "new-value")

	_, freshStillExists := suite.controller.cache["fresh"]
	suite.True(freshStillExists, "fresh entries should survive the cleanup")
	_, newKeyExists := suite.controller.cache["new-key"]
	suite.True(newKeyExists, "the newly-set entry should be present")
	for i := range 1000 {
		_, expiredStillExists := suite.controller.cache[string(rune(i))]
		suite.False(expiredStillExists, "expired entries should be purged by the cleanup")
	}
}
