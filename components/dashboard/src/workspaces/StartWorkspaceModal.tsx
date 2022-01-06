/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import TabMenuItem from "../components/TabMenuItem";

export interface WsStartEntry {
    title: string
    description: string
    startUrl: string
}

interface StartWorkspaceModalProps {
    visible: boolean;
    recent: WsStartEntry[];
    examples: WsStartEntry[];
    selected?: Mode;
    onClose: () => void;
}

type Mode = 'Recent' | 'Examples';

export function StartWorkspaceModal(p: StartWorkspaceModalProps) {
    const computeSelection = () => p.selected || (p.recent.length > 0 ? 'Recent' : 'Examples');
    const [selection, setSelection] = useState(computeSelection());
    useEffect(() => { !p.visible && setSelection(computeSelection()) }, [p.visible, p.recent, p.selected]);

    const list = (selection === 'Recent' ? p.recent : p.examples).map((e, i) =>
        <a key={`item-${i}-${e.title}`} href={e.startUrl} className="rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-800 flex p-4 my-1">
            <div className="w-full">
                <p className="text-base text-gray-800 dark:text-gray-200 font-semibold">{e.title}</p>
                <p>{e.description}</p>
            </div>
        </a>);

    return <Modal onClose={p.onClose} visible={p.visible}>
        <h3 className="pb-2">新工作区</h3>
        {/* separator */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-2 -mx-6 px-6 pt-2">
            <div className="flex">
                <TabMenuItem name='最近' selected={selection === 'Recent'} onClick={() => setSelection('Recent')} />
                <TabMenuItem name='示例' selected={selection === 'Examples'} onClick={() => setSelection('Examples')} />
            </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-2">
            {list.length > 0 ?
                <p className="my-4 text-base">
                    {selection === 'Recent' ?
                        '使用默认分支创建新工作区' :
                        '使用示例项目创建新工作区'}
                </p> : <p className="h-6 my-4"></p>}
            <div className="space-y-2 mt-4 overflow-y-scroll h-80 pr-2">
                {list.length > 0 ? list :
                    (selection === 'Recent' ?
                        <div className="flex flex-col pt-10 items-center px-2">
                            <h3 className="mb-2 text-gray-500 dark:text-gray-400">没有最近的项目</h3>
                            <p className="text-center">您经常使用的项目将显示在此处</p>
                            <p className="text-center"> 在git存储库URL前面加上gitpod.io/#前缀，或者从一个示例开始 </p>
                            <button onClick={() => setSelection('Examples')} className="font-medium mt-8">选择示例</button>
                        </div> :
                        <div className="flex flex-col pt-10 items-center px-2">
                            <h3 className="mb-2 text-gray-500 dark:text-gray-400">没有示例项目</h3>
                            <p className="text-center">很抱歉，似乎没有与当前git提供商一起工作的示例项目</p>
                        </div>)
                }
            </div>
        </div>
    </Modal>;
}
