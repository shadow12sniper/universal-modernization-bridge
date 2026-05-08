export function BridgeTopbar() {
  return (
    <header className="bridge-topbar">
      <div className="bridge-breadcrumb">
        <span>UMB</span>
        <span className="bridge-breadcrumb__sep">/</span>
        <span className="bridge-breadcrumb__current">Overview</span>
      </div>
      <div className="bridge-status-pill bridge-status-pill--online">
        <span className="bridge-status-pill__dot" />
        ALL SYSTEMS NOMINAL
      </div>
      <div className="bridge-system-clock">--:--:-- UTC</div>
    </header>
  );
}