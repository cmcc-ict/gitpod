/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { AuthProviderEntry, AuthProviderInfo } from "cmict-gitpod-protocol";
import { SelectAccountPayload } from "cmict-gitpod-protocol/lib/auth";
import React, { useContext, useEffect, useState } from "react";
import AlertBox from "../components/AlertBox";
import CheckBox from '../components/CheckBox';
import ConfirmationModal from "../components/ConfirmationModal";
import { ContextMenuEntry } from "../components/ContextMenu";
import { Item, ItemField, ItemFieldContextMenu, ItemFieldIcon, ItemsList } from "../components/ItemsList";
import Modal from "../components/Modal";
import { PageWithSubMenu } from "../components/PageWithSubMenu";
import copy from '../images/copy.svg';
import exclamation from '../images/exclamation.svg';
import { openAuthorizeWindow } from "../provider-utils";
import { getGitpodService, gitpodHostUrl } from "../service/service";
import { UserContext } from "../user-context";
import { SelectAccountModal } from "./SelectAccountModal";
import settingsMenu from "./settings-menu";

export default function Integrations() {

    return (<div>
        <PageWithSubMenu subMenu={settingsMenu} title='整合' subtitle='管理git提供程序和集成的权限'>
            <GitProviders />
            <div className="h-12"></div>
            <GitIntegrations />
        </PageWithSubMenu>
    </div>);
}


function GitProviders() {

    const { user, setUser } = useContext(UserContext);

    const [authProviders, setAuthProviders] = useState<AuthProviderInfo[]>([]);
    const [allScopes, setAllScopes] = useState<Map<string, string[]>>(new Map());
    const [disconnectModal, setDisconnectModal] = useState<{ provider: AuthProviderInfo } | undefined>(undefined);
    const [editModal, setEditModal] = useState<{ provider: AuthProviderInfo, prevScopes: Set<string>, nextScopes: Set<string> } | undefined>(undefined);
    const [selectAccountModal, setSelectAccountModal] = useState<SelectAccountPayload | undefined>(undefined);

    useEffect(() => {
        updateAuthProviders();
    }, []);

    useEffect(() => {
        updateCurrentScopes();
    }, [user, authProviders]);

    const updateAuthProviders = async () => {
        setAuthProviders(await getGitpodService().server.getAuthProviders());
    }

    const updateCurrentScopes = async () => {
        if (user) {
            const scopesByProvider = new Map<string, string[]>();
            const connectedProviders = user.identities.map(i => authProviders.find(ap => ap.authProviderId === i.authProviderId));
            for (let provider of connectedProviders) {
                if (!provider) {
                    continue;
                }
                const token = await getGitpodService().server.getToken({ host: provider.host });
                scopesByProvider.set(provider.authProviderId, (token?.scopes?.slice() || []));
            }
            setAllScopes(scopesByProvider);
        }
    }

    const isConnected = (authProviderId: string) => {
        return !!user?.identities?.find(i => i.authProviderId === authProviderId);
    };

    const gitProviderMenu = (provider: AuthProviderInfo) => {
        const result: ContextMenuEntry[] = [];
        const connected = isConnected(provider.authProviderId);
        if (connected) {
            result.push({
                title: '编辑权限',
                onClick: () => startEditPermissions(provider),
                separator: !provider.settingsUrl,
            });
            if (provider.settingsUrl) {
                result.push({
                    title: `在${provider.host}管理`,
                    onClick: () => {
                        window.open(provider.settingsUrl, "_blank", "noopener,noreferrer");
                    },
                    separator: true,
                });
            }
            const connectedWithSecondProvider = authProviders.some(p => p.authProviderId !== provider.authProviderId && isConnected(p.authProviderId))
            if (connectedWithSecondProvider) {
                result.push({
                    title: 'Disconnect',
                    customFontStyle: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300',
                    onClick: () => setDisconnectModal({ provider })
                });
            }
        } else {
            result.push({
                title: '连接',
                customFontStyle: 'text-green-600',
                onClick: () => connect(provider)
            })
        }
        return result;
    };

    const getUsername = (authProviderId: string) => {
        return user?.identities?.find(i => i.authProviderId === authProviderId)?.authName;
    };

    const getPermissions = (authProviderId: string) => {
        return allScopes.get(authProviderId);
    };

    const connect = async (ap: AuthProviderInfo) => {
        await doAuthorize(ap.host, ap.requirements?.default);
    }

    const disconnect = async (ap: AuthProviderInfo) => {
        setDisconnectModal(undefined);
        const returnTo = gitpodHostUrl.with({ pathname: 'complete-auth', search: 'message=success' }).toString();
        const deauthorizeUrl = gitpodHostUrl.withApi({
            pathname: '/deauthorize',
            search: `returnTo=${returnTo}&host=${ap.host}`
        }).toString();

        try {
            await fetch(deauthorizeUrl);
            console.log(`Deauthorized for ${ap.host}`);

            updateUser();
        } catch (error) {
            console.log(`Failed to deauthorize for ${ap.host}`);
        }
    }

    const startEditPermissions = async (provider: AuthProviderInfo) => {
        // todo: add spinner

        const token = await getGitpodService().server.getToken({ host: provider.host });
        if (token) {
            setEditModal({ provider, prevScopes: new Set(token.scopes), nextScopes: new Set(token.scopes) });
        }
    }

    const updateUser = async () => {
        const user = await getGitpodService().server.getLoggedInUser();
        setUser(user);
    }

    const doAuthorize = async (host: string, scopes?: string[]) => {
        try {
            await openAuthorizeWindow({
                host,
                scopes,
                overrideScopes: true,
                onSuccess: () => updateUser(),
                onError: (error) => {
                    if (typeof error === "string") {
                        try {
                            const payload = JSON.parse(error);
                            if (SelectAccountPayload.is(payload)) {
                                setSelectAccountModal(payload)
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
            });
        } catch (error) {
            console.log(error)
        }
    }

    const updatePermissions = async () => {
        if (!editModal) {
            return;
        }
        try {
            await doAuthorize(editModal.provider.host, Array.from(editModal.nextScopes));
        } catch (error) {
            console.log(error);
        }
        setEditModal(undefined);
    }
    const onChangeScopeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editModal) {
            return;
        }
        const scope = e.target.name;
        const nextScopes = new Set(editModal.nextScopes);
        if (e.target.checked) {
            nextScopes.add(scope);
        } else {
            nextScopes.delete(scope);
        }
        setEditModal({ ...editModal, nextScopes });
    }

    const getDescriptionForScope = (scope: string) => {
        switch (scope) {
            case "user:email": return "Read-only access to your email addresses";
            case "read:user": return "Read-only access to your profile information";
            case "public_repo": return "Write access to code in public repositories and organizations";
            case "repo": return "Read/write access to code in private repositories and organizations";
            case "read:org": return "Read-only access to organizations (used to suggest organizations when forking a repository)";
            case "workflow": return "Allow updating GitHub Actions workflow files";
            // GitLab
            case "read_user": return "Read-only access to your email addresses";
            case "api": return "Allow making API calls (used to set up a webhook when enabling prebuilds for a repository)";
            case "read_repository": return "Read/write access to your repositories";
            // Bitbucket
            case "account": return "Read-only access to your account information";
            case "repository": return "Read-only access to your repositories (note: Bitbucket doesn't support revoking scopes)";
            case "repository:write": return "Read/write access to your repositories (note: Bitbucket doesn't support revoking scopes)";
            case "pullrequest": return "Read access to pull requests and ability to collaborate via comments, tasks, and approvals (note: Bitbucket doesn't support revoking scopes)";
            case "pullrequest:write": return "Allow creating, merging and declining pull requests (note: Bitbucket doesn't support revoking scopes)";
            case "webhook": return "Allow installing webhooks (used when enabling prebuilds for a repository, note: Bitbucket doesn't support revoking scopes)";
            default: return "";
        }
    }

    return (<div>

        {selectAccountModal && (
            <SelectAccountModal {...selectAccountModal} close={() => setSelectAccountModal(undefined)} />
        )}

        {disconnectModal && (
            <ConfirmationModal
                title="Disconnect Provider"
                areYouSureText="Are you sure you want to disconnect the following provider?"
                children={{
                    name: disconnectModal.provider.authProviderType,
                    description: disconnectModal.provider.host,
                }}
                buttonText="Disconnect Provider"
                onClose={() => setDisconnectModal(undefined)}
                onConfirm={() => disconnect(disconnectModal.provider)}
            />
        )}

        {editModal && (
            <Modal visible={true} onClose={() => setEditModal(undefined)}>
                <h3 className="pb-2">编辑权限</h3>
                <div className="border-t border-b border-gray-200 dark:border-gray-800 mt-2 -mx-6 px-6 py-4">
                    <div className="text-gray-500">
                        配置提供程序权限
                    </div>
                    {(editModal.provider.scopes || []).map(scope => (
                        <div key={`scope-${scope}`}>
                            <CheckBox
                                name={scope}
                                desc={getDescriptionForScope(scope)}
                                title={scope}
                                key={`scope-checkbox-${scope}`}
                                checked={editModal.nextScopes.has(scope)}
                                disabled={editModal.provider.requirements?.default.includes(scope)}
                                onChange={onChangeScopeHandler}
                            ></CheckBox>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={() => updatePermissions()}
                        disabled={equals(editModal.nextScopes, editModal.prevScopes)}
                    >
                        更新权限
                    </button>
                </div>
            </Modal>
        )}

        <h3>Git提供者</h3>
        <h2>管理git提供程序的权限.</h2>
        <ItemsList className="pt-6">
            {authProviders && authProviders.map(ap => (
                <Item key={"ap-" + ap.authProviderId} className="h-16">
                    <ItemFieldIcon>
                        <div className={"rounded-full w-3 h-3 text-sm align-middle m-auto " + (isConnected(ap.authProviderId) ? "bg-green-500" : "bg-gray-400")}>
                            &nbsp;
                        </div>
                    </ItemFieldIcon>
                    <ItemField className="w-4/12 xl:w-3/12 flex flex-col">
                        <span className="my-auto font-medium truncate overflow-ellipsis">{ap.authProviderType}</span>
                        <span className="text-sm my-auto text-gray-400 truncate overflow-ellipsis">{ap.host}</span>
                    </ItemField>
                    <ItemField className="w-6/12 xl:w-3/12 flex flex-col">
                        <span className="my-auto truncate text-gray-500 overflow-ellipsis">{getUsername(ap.authProviderId) || "–"}</span>
                        <span className="text-sm my-auto text-gray-400">用户名</span>
                    </ItemField>
                    <ItemField className="hidden xl:w-5/12 xl:flex xl:flex-col">
                        <span className="my-auto truncate text-gray-500 overflow-ellipsis">{getPermissions(ap.authProviderId)?.join(", ") || "–"}</span>
                        <span className="text-sm my-auto text-gray-400">Permissions</span>
                    </ItemField>
                    <ItemFieldContextMenu menuEntries={gitProviderMenu(ap)} />
                </Item>
            ))}
        </ItemsList>
    </div>);
}

function GitIntegrations() {

    const { user } = useContext(UserContext);

    const [providers, setProviders] = useState<AuthProviderEntry[]>([]);

    const [modal, setModal] = useState<{ mode: "new" } | { mode: "edit", provider: AuthProviderEntry } | { mode: "delete", provider: AuthProviderEntry } | undefined>(undefined);

    useEffect(() => {
        updateOwnAuthProviders();
    }, []);

    const updateOwnAuthProviders = async () => {
        setProviders(await getGitpodService().server.getOwnAuthProviders());
    }

    const deleteProvider = async (provider: AuthProviderEntry) => {
        try {
            await getGitpodService().server.deleteOwnAuthProvider(provider);
        } catch (error) {
            console.log(error);
        }
        setModal(undefined);
        updateOwnAuthProviders();
    }

    const gitProviderMenu = (provider: AuthProviderEntry) => {
        const result: ContextMenuEntry[] = [];
        result.push({
            title: provider.status === "verified" ? "编辑配置" : "激活集成",
            onClick: () => setModal({ mode: "edit", provider }),
            separator: true,
        })
        result.push({
            title: '移除',
            customFontStyle: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300',
            onClick: () => setModal({ mode: "delete", provider })
        });
        return result;
    };

    return (<div>

        {modal?.mode === "new" && (
            <GitIntegrationModal mode={modal.mode} userId={user?.id || "no-user"} onClose={() => setModal(undefined)} onUpdate={updateOwnAuthProviders} />
        )}
        {modal?.mode === "edit" && (
            <GitIntegrationModal mode={modal.mode} userId={user?.id || "no-user"} provider={modal.provider} onClose={() => setModal(undefined)} onUpdate={updateOwnAuthProviders} />
        )}
        {modal?.mode === "delete" && (
            <ConfirmationModal
                title="移除集成"
                areYouSureText="是否确实要删除以下的git集成?"
                children={{
                    name: modal.provider.type,
                    description: modal.provider.host,
                }}
                buttonText="删除工作区"
                onClose={() => setModal(undefined)}
                onConfirm={() => deleteProvider(modal.provider)}
            />

        )}

        <div className="flex items-start sm:justify-between mb-2">
            <div>
                <h3>Git集成</h3>
                <h2 className="text-gray-500">管理GitLab或GitHub自托管实例的git集成.</h2>
            </div>
            {providers.length !== 0
                ?
                <div className="mt-3 flex mt-0">
                    <button onClick={() => setModal({ mode: "new" })} className="ml-2">新建整合</button>
                </div>
                : null}
        </div>

        {providers && providers.length === 0 && (
            <div className="w-full flex h-80 mt-2 rounded-xl bg-gray-100 dark:bg-gray-900">
                <div className="m-auto text-center">
                    <h3 className="self-center text-gray-500 dark:text-gray-400 mb-4">没有Git集成</h3>
                    <div className="text-gray-500 mb-6">除了默认的Git提供程序之外，您还可以使用提供程序的自托管实例来授权.</div>
                    <button className="self-center" onClick={() => setModal({ mode: "new" })}>新建整合</button>
                </div>
            </div>
        )}
        <ItemsList className="pt-6">
            {providers && providers.map(ap => (
                <Item key={"ap-" + ap.id} className="h-16">
                    <ItemFieldIcon>
                        <div className={"rounded-full w-3 h-3 text-sm align-middle m-auto " + (ap.status === "verified" ? "bg-green-500" : "bg-gray-400")}>
                            &nbsp;
                        </div>
                    </ItemFieldIcon>
                    <ItemField className="w-3/12 flex flex-col">
                        <span className="font-medium truncate overflow-ellipsis">{ap.type}</span>
                    </ItemField>
                    <ItemField className="w-7/12 flex flex-col">
                        <span className="my-auto truncate text-gray-500 overflow-ellipsis">{ap.host}</span>
                    </ItemField>
                    <ItemFieldContextMenu menuEntries={gitProviderMenu(ap)} />
                </Item>
            ))}
        </ItemsList>
    </div>);
}

export function GitIntegrationModal(props: ({
    mode: "new",
} | {
    mode: "edit",
    provider: AuthProviderEntry
}) & {
    login?: boolean,
    headerText?: string,
    userId: string,
    onClose?: () => void,
    closeable?: boolean,
    onUpdate?: () => void,
    onAuthorize?: (payload?: string) => void
}) {

    const callbackUrl = (host: string) => {
        const pathname = `/auth/${host}/callback`;
        return gitpodHostUrl.with({ pathname }).toString();
    }

    const [mode, setMode] = useState<"new" | "edit">("new");
    const [providerEntry, setProviderEntry] = useState<AuthProviderEntry | undefined>(undefined);

    const [type, setType] = useState<string>("GitLab");
    const [host, setHost] = useState<string>("gitlab.example.com");
    const [schema, setSchema] = useState<string>("https");
    const [redirectURL, setRedirectURL] = useState<string>(callbackUrl("gitlab.example.com"));
    const [clientId, setClientId] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string>("");
    const [busy, setBusy] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [validationError, setValidationError] = useState<string | undefined>();

    useEffect(() => {
        setMode(props.mode);
        if (props.mode === "edit") {
            setProviderEntry(props.provider);
            setType(props.provider.type);
            setHost(props.provider.host);
            setClientId(props.provider.oauth.clientId);
            setClientSecret(props.provider.oauth.clientSecret);
            setRedirectURL(props.provider.oauth.callBackUrl);
        }
    }, []);

    useEffect(() => {
        setErrorMessage(undefined);
        validate();
    }, [clientId, clientSecret, type])

    useEffect(() => {
        if (props.mode === "new") {
            // If the host value has been modified e.g. not gitlab.example.com, assume it has been set by user and end operation
            if (!host.includes(".example.com")) return;
            const exampleHostname = `${type.toLowerCase()}.example.com`;
            updateHostValue(exampleHostname);
        }
    }, [type]);

    const onClose = () => props.onClose && props.onClose();
    const onUpdate = () => props.onUpdate && props.onUpdate();

    const activate = async () => {
        let entry = (mode === "new") ? {
            host,
            schema,
            type,
            clientId,
            clientSecret,
            ownerId: props.userId
        } as AuthProviderEntry.NewEntry : {
            id: providerEntry?.id,
            ownerId: props.userId,
            clientId,
            clientSecret: clientSecret === "redacted" ? undefined : clientSecret
        } as AuthProviderEntry.UpdateEntry;

        setBusy(true);
        setErrorMessage(undefined);
        try {
            const newProvider = await getGitpodService().server.updateOwnAuthProvider({ entry });

            // the server is checking periodically for updates of dynamic providers, thus we need to
            // wait at least 2 seconds for the changes to be propagated before we try to use this provider.
            await new Promise(resolve => setTimeout(resolve, 2000));

            onUpdate();

            const updateProviderEntry = async () => {
                const provider = (await getGitpodService().server.getOwnAuthProviders()).find(ap => ap.id === newProvider.id);
                if (provider) {
                    setProviderEntry(provider);
                }
            }

            // just open the authorization window and do *not* await
            openAuthorizeWindow({
                login: props.login,
                host: newProvider.host,
                onSuccess: (payload) => {
                    updateProviderEntry();
                    onUpdate();
                    props.onAuthorize && props.onAuthorize(payload);
                },
                onError: (payload) => {
                    updateProviderEntry();
                    let errorMessage: string;
                    if (typeof payload === "string") {
                        errorMessage = payload;
                    } else {
                        errorMessage = payload.description ? payload.description : `Error: ${payload.error}`;
                    }
                    setErrorMessage(errorMessage);
                }
            });

            if (props.closeable) {
                // close the modal, as the creation phase is done anyways.
                onClose();
            } else {
                // switch mode to stay and edit this integration.
                // this modal is expected to be closed programmatically.
                setMode("edit");
                setProviderEntry(newProvider);
            }
        } catch (error) {
            console.log(error);
            setErrorMessage("message" in error ? error.message : "Failed to update Git provider");
        }
        setBusy(false);
    }

    const updateHostValue = (host: string) => {
        if (mode === "new") {
            setHost(host);
            setRedirectURL(callbackUrl(host));
            setErrorMessage(undefined);
        }
    }

    const updateSchemaValue = (schema: string) => {
        if (mode === "new") {
            setSchema(schema);
            setErrorMessage(undefined);
        }
    }

    const updateClientId = (value: string) => {
        setClientId(value);
    }
    const updateClientSecret = (value: string) => {
        setClientSecret(value);
    }

    const validate = () => {
        const errors: string[] = [];
        if (clientId.trim().length === 0) {
            errors.push(`${type === "GitLab" ? "应用ID" : "客户端ID"} 缺少.`);
        }
        if (clientSecret.trim().length === 0) {
            errors.push(`${type === "GitLab" ? "密码" : "客户端密码"} 缺少.`);
        }
        if (errors.length === 0) {
            setValidationError(undefined);
            return true;
        } else {
            setValidationError(errors.join("\n"));
            return false;
        }
    }

    const getRedirectUrlDescription = (type: string, schema: string, host: string) => {
        let settingsUrl = ``;
        switch (type) {
            case "GitHub":
                settingsUrl = `${schema}://${host}/settings/developers`;
                break;
            case "GitLab":
                settingsUrl = `${schema}://${host}/-/profile/applications`;
                break;
            default: return undefined;
        }
        // let docsUrl = ``;
        // switch (type) {
        //     case "GitHub":
        //         docsUrl = `https://www.gitpod.io/docs/github-integration/#oauth-application`;
        //         break;
        //     case "GitLab":
        //         docsUrl = `https://www.gitpod.io/docs/gitlab-integration/#oauth-application`;
        //         break;
        //     default: return undefined;
        // }

        return (<span>
            使用此重定向URL更新OAuth应用程序.
            转到 <a href={`https://${settingsUrl}`} target="_blank" rel="noopener" className="text-gray-400 learn-more hover:text-gray-600">developer settings</a> 并设置OAuth应用程序.&nbsp;
            {/* <a href={docsUrl} target="_blank" rel="noopener" className="text-gray-400 learn-more hover:text-gray-600">Learn more</a>. */}
        </span>);
    }

    const copyRedirectUrl = () => {
        const el = document.createElement("textarea");
        el.value = redirectURL;
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand("copy");
        } finally {
            document.body.removeChild(el);
        }
    };

    return (<Modal visible={!!props} onClose={onClose} closeable={props.closeable}>
        <h3 className="pb-2">{mode === "new" ? "新建Git集成" : "Git集成"}</h3>
        <div className="space-y-4 border-t border-b border-gray-200 dark:border-gray-800 mt-2 -mx-6 px-6 py-4">
            {mode === "edit" && providerEntry?.status !== "verified" && (
                <AlertBox>You need to activate this integration.</AlertBox>
            )}
            <div className="flex flex-col">
                <span className="text-gray-500">{props.headerText || "配置与GitLab或GitHub自托管实例的git集成."}</span>
            </div>

            <div className="overscroll-contain max-h-96 overflow-y-auto pr-2">
                {mode === "new" && (
                    <div className="flex flex-col space-y-2">
                        <label htmlFor="type" className="font-medium">提供者类型</label>
                        <select name="type" value={type} disabled={mode !== "new"} className="w-full"
                            onChange={(e) => setType(e.target.value)}>
                            <option value="GitHub">GitHub</option>
                            <option value="GitLab">GitLab</option>
                        </select>
                    </div>
                )}
                <div className="flex flex-col space-y-2">
                    <label htmlFor="hostName" className="font-medium">提供者主机名</label>
                    <input name="hostName" disabled={mode === "edit"} type="text" value={host} className="w-full"
                        onChange={(e) => updateHostValue(e.target.value)} />
                </div>
                {/* 新增请求类型单选框 */}
                <div className="flex flex-col space-y-2">
                    <label htmlFor="schema" className="font-medium">类型</label>
                    <select name="schema" value={schema} disabled={mode === "edit"} className="w-full"
                        onChange={(e) => updateSchemaValue(e.target.value)}>
                        <option value="http">http</option>
                        <option value="https">https</option>
                    </select>

                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="redirectURL" className="font-medium">重定向地址</label>
                    <div className="w-full relative">
                        <input name="redirectURL" disabled={true} readOnly={true} type="text" value={redirectURL} className="w-full pr-8" />
                        <div className="cursor-pointer" onClick={() => copyRedirectUrl()}>
                            <img src={copy} title="Copy the Redirect URL to clipboard" className="absolute top-1/3 right-3" />
                        </div>
                    </div>
                    <span className="text-gray-500 text-sm">{getRedirectUrlDescription(type, schema, host)}</span>
                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="clientId" className="font-medium">{`${type === "GitLab" ? "应用 ID" : "客户端 ID"}`}</label>
                    <input name="clientId" type="text" value={clientId} className="w-full"
                        onChange={(e) => updateClientId(e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="clientSecret" className="font-medium">{`${type === "GitLab" ? "密码" : "客户端密码"}`}</label>
                    <input name="clientSecret" type="password" value={clientSecret} className="w-full"
                        onChange={(e) => updateClientSecret(e.target.value)} />
                </div>
            </div>

            {(errorMessage || validationError) && (
                <div className="flex rounded-md bg-red-600 p-3">
                    <img className="w-4 h-4 mx-2 my-auto filter-brightness-10" src={exclamation} />
                    <span className="text-white">{errorMessage || validationError}</span>
                </div>
            )}
        </div>
        <div className="flex justify-end mt-6">
            <button onClick={() => validate() && activate()} disabled={!!validationError || busy}>激活集成</button>
        </div>
    </Modal>);
}

function equals(a: Set<string>, b: Set<string>): boolean {
    return a.size === b.size && Array.from(a).every(e => b.has(e));
}
