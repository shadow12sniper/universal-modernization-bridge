import Link from "next/link";

export function BridgeSidebar() {
  return (
    <aside className="bridge-sidebar">
      <div className="bridge-logo">
        <div className="bridge-logo__wordmark">UMB Bridge</div>
        <div className="bridge-logo__sub">v1.0.0 • ENTERPRISE</div>
      </div>

      <div className="bridge-nav__group-label">Core</div>
      <Link href="/dashboard" className="bridge-nav__item bridge-nav__item--active">
        Overview
      </Link>
      <Link href="/dashboard/connectors" className="bridge-nav__item">
        Connectors
      </Link>

      <div className="bridge-nav__group-label">System</div>
      <Link href="/dashboard/settings" className="bridge-nav__item">
        Settings
      </Link>
    </aside>
  );
}