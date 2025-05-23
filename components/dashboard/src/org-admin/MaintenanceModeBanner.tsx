/**
 * Copyright (c) 2025 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License.AGPL.txt in the project root for license information.
 */

import { FC } from "react";
import Alert from "../components/Alert";
import { useMaintenanceMode } from "../data/maintenance-mode/maintenance-mode-query";

export const MaintenanceModeBanner: FC = () => {
    const { isMaintenanceMode } = useMaintenanceMode();

    if (!isMaintenanceMode) {
        return null;
    }

    return (
        <Alert type="warning" className="mb-2">
            <div className="flex items-center flex-wrap gap-2">
                <span className="font-semibold">System is in maintenance mode.</span>
                <span>Starting new workspaces is currently disabled by your organization owner.</span>
            </div>
        </Alert>
    );
};
