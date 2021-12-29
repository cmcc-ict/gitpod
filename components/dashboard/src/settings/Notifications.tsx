/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { useContext } from "react";
import { getGitpodService } from "../service/service";
import { UserContext } from "../user-context";
import CheckBox from "../components/CheckBox";
import { PageWithSubMenu } from "../components/PageWithSubMenu";
import settingsMenu from "./settings-menu";

export default function Notifications() {
    const { user, setUser } = useContext(UserContext);
    const isTransactionalMail = !user?.additionalData?.emailNotificationSettings?.disallowTransactionalEmails;
    const toggleTransactionalMail = async ()=>{
        if (user) {
            user.additionalData = {
                ... {
                    ... user.additionalData,
                    emailNotificationSettings: {
                        ... user.additionalData?.emailNotificationSettings,
                        disallowTransactionalEmails: !!isTransactionalMail
                    }
                }
            }
            await getGitpodService().server.updateLoggedInUser({
                additionalData: user.additionalData
            });
            setUser(user);
        }
    };
    const isMarketingMail = !!user?.allowsMarketingCommunication;
    const toggleMarketingMail = async ()=> {
        if (user) {
            user.allowsMarketingCommunication = !user?.allowsMarketingCommunication;
            await getGitpodService().server.updateLoggedInUser({
                allowsMarketingCommunication: user.allowsMarketingCommunication
            });
            setUser(user);
        }
    }
    return <div>
        <PageWithSubMenu subMenu={settingsMenu}  title='通知' subtitle='选择何时收到通知.'>
            <h3>电子邮件通知首选项</h3>
            <CheckBox
                title="帐户通知"
                desc="接收有关帐户更改的电子邮件"
                checked={isTransactionalMail}
                onChange={toggleTransactionalMail}/>
            <CheckBox
                title="产品通知"
                desc="接收有关产品更新和新闻的电子邮件"
                checked={isMarketingMail}
                onChange={toggleMarketingMail}/>
        </PageWithSubMenu>
    </div>;
}
