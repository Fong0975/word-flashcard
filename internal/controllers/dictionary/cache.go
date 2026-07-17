package dictionary

import "time"

// getFromCache retrieves data from the cache
func (dc *Controller) getFromCache(key string) interface{} {
	dc.cacheMutex.RLock()
	defer dc.cacheMutex.RUnlock()

	entry, exists := dc.cache[key]
	if !exists {
		return nil
	}

	if time.Since(entry.Timestamp) > dc.cacheTTL {
		delete(dc.cache, key)
		return nil
	}

	return entry.Data
}

// setCache stores data in the cache
func (dc *Controller) setCache(key string, data interface{}) {
	dc.cacheMutex.Lock()
	defer dc.cacheMutex.Unlock()

	dc.cache[key] = CacheEntry{
		Data:      data,
		Timestamp: time.Now(),
	}

	// Clean up old cache entries if cache size exceeds 1000
	if len(dc.cache) > 1000 {
		now := time.Now()
		for k, v := range dc.cache {
			if now.Sub(v.Timestamp) > dc.cacheTTL {
				delete(dc.cache, k)
			}
		}
	}
}
