package health

import (
	"fmt"
	"os"
	"path/filepath"
)

// findVersionFile walks up the directory tree from the current working directory
// until it locates a VERSION file, returning its absolute path.
func findVersionFile() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		path := filepath.Join(dir, "VERSION")
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("VERSION file not found in any parent directory")
		}
		dir = parent
	}
}
