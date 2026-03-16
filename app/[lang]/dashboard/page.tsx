// Server wrapper for dashboard page - enables force-dynamic config
export const dynamic = 'force-dynamic';

import { DashboardPage } from './DashboardClient';

export default function Page() {
    return <DashboardPage />;
}
