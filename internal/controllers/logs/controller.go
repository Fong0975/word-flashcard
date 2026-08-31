package logs

// Controller handles backend log viewing requests.
//
// Unlike the other controllers it holds no peers: every endpoint reads the
// log files written by utils/log.InitLogger straight off disk, and the
// unread watermark is a small JSON file beside them (see read_state.go).
type Controller struct{}

// New creates a new Controller instance
func New() *Controller {
	return &Controller{}
}
