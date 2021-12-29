/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { User } from "cmict-gitpod-protocol";
import { useContext, useState } from "react";
import { PageWithSubMenu } from "../components/PageWithSubMenu";
import { getGitpodService, gitpodHostUrl } from "../service/service";
import { UserContext } from "../user-context";
import settingsMenu from "./settings-menu";
import ConfirmationModal from "../components/ConfirmationModal";
import CodeText from "../components/CodeText";

export default function Account() {
    const { user } = useContext(UserContext);

    const [modal, setModal] = useState(false);
    const [typedEmail, setTypedEmail] = useState('');

    const primaryEmail = User.getPrimaryEmail(user!);

    const deleteAccount = async () => {
        await getGitpodService().server.deleteAccount();
        document.location.href = gitpodHostUrl.asApiLogout().toString();
    };

    const close = () => setModal(false);
    return <div>
        <ConfirmationModal
            title="Delete Account"
            areYouSureText="You are about to permanently delete your account."
            buttonText="Delete Account"
            buttonDisabled={typedEmail !== primaryEmail}
            visible={modal}
            onClose={close}
            onConfirm={deleteAccount}
        >
            <ol className="text-gray-500 text-sm list-outside list-decimal">
                <li className="ml-5">All your workspaces and related data will be deleted and cannot be restored afterwards.</li>
                <li className="ml-5">Your subscription will be cancelled. If you obtained a Cmict subscription through the GitHub marketplace, you need to cancel your plan there.</li>
            </ol>
            <p className="pt-4 pb-2 text-gray-600 dark:text-gray-400 text-base font-semibold">Type your email to confirm</p>
            <input className="w-full" type="text" onChange={e => setTypedEmail(e.target.value)}></input>
        </ConfirmationModal>

        <PageWithSubMenu subMenu={settingsMenu}  title='账户' subtitle='管理帐户和git配置'>
            <h3>简介</h3>
            <p className="text-base text-gray-500 pb-4 max-w-2xl">以下信息将用于设置git配置。通过使用默认环境变量，可以覆盖每个项目的git作者姓名和电子邮件 <CodeText>GIT_AUTHOR_NAME</CodeText> and <CodeText>GIT_COMMITTER_EMAIL</CodeText>.</p>
            <div className="flex flex-col lg:flex-row">
                <div>
                    <div className="mt-4">
                        <h4>Name</h4>
                        <input type="text" disabled={true} value={user?.fullName || user?.name} />
                    </div>
                    <div className="mt-4">
                        <h4>Email</h4>
                        <input type="text" disabled={true} value={User.getPrimaryEmail(user!)} />
                    </div>
                </div>
                <div className="lg:pl-14">
                    <div className="mt-4">
                        <h4>Avatar</h4>
                        <img className="rounded-full w-24 h-24"
                            src={user!.avatarUrl} alt={user!.name} />
                    </div>
                </div>
            </div>
            <h3 className="mt-12">删除帐户</h3>
            <p className="text-base text-gray-500 pb-4">此操作将删除与您在Cmict中的帐户相关的所有数据.</p>
            <button className="danger secondary" onClick={() => setModal(true)}>删除帐户</button>
        </PageWithSubMenu>
    </div>;
}
