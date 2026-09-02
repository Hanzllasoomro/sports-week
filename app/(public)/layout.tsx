/**
 * Public route group layout.
 * Wraps all public pages with the SideNav (desktop) and BottomNav (mobile).
 * Components will be built in Phase 1 — for now, just pass children through.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* SideNav placeholder — Phase 1 */}
      <main className="flex-1">{children}</main>
      {/* BottomNav placeholder — Phase 1 */}
    </div>
  );
}
