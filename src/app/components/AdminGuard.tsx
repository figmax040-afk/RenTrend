import { Navigate, Outlet } from "react-router";
import { useIsAdmin } from "../../lib/useIsAdmin";

/** Wraps the /admin routes; anyone who isn't an admin is sent home. */
export function AdminGuard() {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
}
