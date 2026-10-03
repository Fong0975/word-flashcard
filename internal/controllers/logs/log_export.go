package logs

import (
	"archive/zip"
	"bytes"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	logContentType = "text/plain; charset=utf-8"
	zipContentType = "application/zip"

	// exportTimestampLayout matches the layout backup/export.go uses for its
	// download file names.
	exportTimestampLayout = "20060102-150405"
)

// LogExport is a ready-to-send download of the backend log files.
type LogExport struct {
	FileName    string
	ContentType string
	Content     []byte
}

// BuildLogExport packages the current log file and its rotated siblings for
// download: a lone file is returned as-is, several are zipped together. now
// only stamps the archive name.
//
// The archive is built in memory rather than in a temporary file, so nothing
// is ever left behind on the server and there is no cleanup that could fail.
//
// It returns nil when there is nothing to export, which covers both "nothing
// logged yet" and every listed file having been rotated away before it could
// be read.
func BuildLogExport(logFilePath string, now time.Time) (*LogExport, error) {
	files, err := ListLogFiles(logFilePath)
	if err != nil {
		return nil, err
	}

	switch len(files) {
	case 0:
		return nil, nil
	case 1:
		content, err := os.ReadFile(files[0].Path)
		if err != nil {
			if os.IsNotExist(err) {
				return nil, nil
			}
			return nil, err
		}

		return &LogExport{FileName: files[0].Name, ContentType: logContentType, Content: content}, nil
	}

	content, written, err := zipLogFiles(files)
	if err != nil {
		return nil, err
	}
	if written == 0 {
		return nil, nil
	}

	return &LogExport{
		FileName:    archiveFileName(logFilePath, now),
		ContentType: zipContentType,
		Content:     content,
	}, nil
}

// archiveFileName derives the zip name from the log file's own name, e.g.
// "word-flashcard.log" becomes "word-flashcard-logs-20260101-000000.zip".
func archiveFileName(logFilePath string, now time.Time) string {
	base := filepath.Base(logFilePath)
	name := strings.TrimSuffix(base, filepath.Ext(base))

	return name + "-logs-" + now.UTC().Format(exportTimestampLayout) + ".zip"
}

// zipLogFiles compresses files into a single in-memory zip archive and
// reports how many of them made it in.
//
// Each file is streamed into the archive, so peak memory is the compressed
// output rather than the raw rotation set. A file that vanished since it was
// listed is skipped, for the same reason walkEntries skips it: a rotation
// between listing and reading is normal, not a failure.
func zipLogFiles(files []LogFileInfo) ([]byte, int, error) {
	var buf bytes.Buffer
	archive := zip.NewWriter(&buf)

	written := 0
	for _, file := range files {
		added, err := addFileToArchive(archive, file)
		if err != nil {
			return nil, 0, err
		}
		if added {
			written++
		}
	}

	if err := archive.Close(); err != nil {
		return nil, 0, err
	}

	return buf.Bytes(), written, nil
}

// addFileToArchive copies one log file into archive, reporting false when the
// file no longer exists.
func addFileToArchive(archive *zip.Writer, file LogFileInfo) (bool, error) {
	source, err := os.Open(file.Path)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	defer source.Close()

	entry, err := archive.CreateHeader(&zip.FileHeader{
		Name:     file.Name,
		Method:   zip.Deflate,
		Modified: file.ModTime,
	})
	if err != nil {
		return false, err
	}

	if _, err := io.Copy(entry, source); err != nil {
		return false, err
	}

	return true, nil
}
