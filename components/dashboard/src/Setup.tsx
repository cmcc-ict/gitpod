/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { useEffect, useState } from "react";
import Modal from "./components/Modal";
import { getGitpodService, gitpodHostUrl } from "./service/service";
import { GitIntegrationModal } from "./settings/Integrations";

export default function Setup() {

    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            const dynamicAuthProviders = await getGitpodService().server.getOwnAuthProviders();
            const previous = dynamicAuthProviders.filter(ap => ap.ownerId === "no-user")[0];
            if (previous) {
                await getGitpodService().server.deleteOwnAuthProvider({ id: previous.id });
            }
        })();
    }, []);

    const acceptAndContinue = () => {
        setShowModal(true);
    }

    const onAuthorize = (payload?: string) => {
        // run without await, so the integrated closing of new tab isn't blocked
        (async () => {
            window.location.href = gitpodHostUrl.asDashboard().toString();
        })();
    }

    const headerText = "配置与GitLab或GitHub实例的git集成."

    return <div>
        {!showModal && (
            <Modal visible={true} onClose={() => { }} closeable={false}>
                <h3 className="pb-2">欢迎来到 OneCodeSpace 🎉</h3>
                <div className="border-t border-b border-gray-200 dark:border-gray-800 mt-2 -mx-6 px-6 py-4">
                    <p className="pb-4 text-gray-500 text-base">要开始使用OneCodeSpace，您需要设置git集成.</p>

                    <div className="flex">
                        <span className="text-gray-500">
                            {/* By using Cmict, you agree to our <a className="learn-more hover:text-gray-600" target="gitpod-terms" href="https://www.gitpod.io/self-hosted-terms/">terms</a>. */}
                        </span>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button className={"ml-2"} onClick={() => acceptAndContinue()}>Continue</button>
                </div>
            </Modal>
        )}
        {showModal && (
            <GitIntegrationModal mode="new" login={true} headerText={headerText} userId="no-user" onAuthorize={onAuthorize} />
        )}
    </div>;
}
