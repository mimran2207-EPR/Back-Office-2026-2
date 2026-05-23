class EprErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Caught by EprErrorBoundary:', error, errorInfo);
  }
  reset = () => { this.setState({ hasError: false, error: null, errorInfo: null }); };
  reload = () => { window.location.reload(); };
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="ep-eb" role="alert" aria-live="assertive">
        <div className="ep-eb-card">
          <div className="ep-eb-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <h2>אופס, משהו השתבש</h2>
          <p>קרתה תקלה בלתי צפויה במערכת. ניתן לנסות שוב או לרענן את העמוד.</p>
          <div className="ep-eb-actions">
            <button className="ep-btn ep-btn-ghost" onClick={this.reset} aria-label="נסה שוב">נסה שוב</button>
            <button className="ep-btn ep-btn-primary" onClick={this.reload} aria-label="רענן עמוד">רענן עמוד</button>
          </div>
          <details className="ep-eb-details">
            <summary>פרטים טכניים</summary>
            <pre dir="ltr">{(this.state.error && this.state.error.toString()) || 'Unknown error'}
{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
        </div>
      </div>
    );
  }
}

window.EprErrorBoundary = EprErrorBoundary;
