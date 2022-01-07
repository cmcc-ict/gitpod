/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

 import { AuthProviderInfo } from "cmict-gitpod-protocol";
 import { useContext, useEffect, useState } from "react";
 import { UserContext } from "./user-context";
 import { TeamsContext } from "./teams/teams-context";
 import { getGitpodService } from "./service/service";
 import { iconForAuthProvider, openAuthorizeWindow, simplifyProviderName, getSafeURLRedirect } from "./provider-utils";
 import gitpod from './images/gitpod.svg';
 import gitpodDark from './images/gitpod-dark.svg';
 import gitpodIcon from './icons/gitpod.svg';
 import automate from "./images/welcome/automate.svg";
 import code from "./images/welcome/code.svg";
 import collaborate from "./images/welcome/collaborate.svg";
 import customize from "./images/welcome/customize.svg";
 import fresh from "./images/welcome/fresh.svg";
 import prebuild from "./images/welcome/prebuild.svg";
 import exclamation from "./images/exclamation.svg";


 function Item(props: { icon: string, iconSize?: string, text: string }) {
     const iconSize = props.iconSize || 28;
     return <div className="flex-col items-center w-1/3 px-3">
         <img src={props.icon} className={`w-${iconSize} m-auto h-24`} />
         <div className="text-gray-400 text-sm w-36 h-20 text-center">{props.text}</div>
     </div>;
 }

 export function markLoggedIn() {
     document.cookie = "gitpod-user=loggedIn;max-age=" + 60 * 60 * 24 * 365;
 }

 export function hasLoggedInBefore() {
     return document.cookie.match("gitpod-user=loggedIn");
 }

 export function Login() {
     const { setUser } = useContext(UserContext);
     const { setTeams } = useContext(TeamsContext);
     const showWelcome = !hasLoggedInBefore();

     const [ authProviders, setAuthProviders ] = useState<AuthProviderInfo[]>([]);
     const [ errorMessage, setErrorMessage ] = useState<string | undefined>(undefined);

     useEffect(() => {
         (async () => {
             setAuthProviders(await getGitpodService().server.getAuthProviders());
         })();
     }, [])

     const authorizeSuccessful = async (payload?: string) => {
         updateUser();
         // Check for a valid returnTo in payload
         const safeReturnTo = getSafeURLRedirect(payload);
         if (safeReturnTo) {
             // ... and if it is, redirect to it
             window.location.replace(safeReturnTo);
         }
     }

     const updateUser = async () => {
         await getGitpodService().reconnect();
         const [ user, teams ] = await Promise.all([
             getGitpodService().server.getLoggedInUser(),
             getGitpodService().server.getTeams(),
         ]);
         setUser(user);
         setTeams(teams);
         markLoggedIn();
     }

     const openLogin = async (host: string) => {
         setErrorMessage(undefined);

         try {
             await openAuthorizeWindow({
                 login: true,
                 host,
                 onSuccess: authorizeSuccessful,
                 onError: (payload) => {
                     let errorMessage: string;
                     if (typeof payload === "string") {
                         errorMessage = payload;
                     } else {
                         errorMessage = payload.description ? payload.description : `Error: ${payload.error}`;
                         if (payload.error === "email_taken") {
                             errorMessage = `Email address already exists. Log in using a different provider.`;
                         }
                     }
                     setErrorMessage(errorMessage);
                 }
             });
         } catch (error) {
             console.log(error)
         }
     }

     return (<div id="login-container" className="z-50 flex w-screen h-screen">
         {showWelcome ? <div id="feature-section" className="flex-grow bg-gray-100 dark:bg-gray-800 w-1/2 hidden lg:block">
             <div id="feature-section-column" className="flex max-w-xl h-full mx-auto pt-6">
                 <div className="flex flex-col px-8 my-auto ml-auto">
                     <div className="mb-12">
                         <img src={gitpod} className="h-8 block dark:hidden" />
                         <img src={gitpodDark} className="h-8 hidden dark:block" />
                     </div>
                     <div className="mb-10">
                         <h1 className="text-5xl mb-3">OneCodeSpace</h1>
                         <div className="text-gray-400 text-lg">
                             为云中的每个任务秒级启动全新的自动化开发环境。
                         </div>
                     </div>
                     <div className="flex mb-10">
                         <Item icon={code} iconSize="16" text="时刻准备好编程" />
                         <Item icon={customize} text="工作空间个性化" />
                         <Item icon={automate} text="开发设置自动化" />
                     </div>
                     <div className="flex">
                         <Item icon={prebuild} text="持续预构建项目 " />
                         <Item icon={collaborate} text="与团队协作" />
                         <Item icon={fresh} text="新任务有新工作区" />
                     </div>
                 </div>
             </div>
         </div> : null}
         <div id="login-section" className={"flex-grow flex w-full" + (showWelcome ? " lg:w-1/2" : "")}>
             <div id="login-section-column" className={"flex-grow max-w-2xl flex flex-col h-100 mx-auto" + (showWelcome ? " lg:my-0" : "")}>
                 <div className="flex-grow h-100 flex flex-row items-center justify-center" >
                     <div className="rounded-xl px-10 py-10 mx-auto">
                         <div className="mx-auto pb-8">
                             <img src={gitpodIcon} className="h-16 mx-auto" />
                         </div>
                         <div className="mx-auto text-center pb-8 space-y-2">
                             <h1 className="text-3xl">登录{showWelcome ? '' : ' 到 OneCodeSpace'}</h1>
                             <h2 className="uppercase text-sm text-gray-400">时刻准备好编程</h2>
                         </div>
                         <div className="flex flex-col space-y-3 items-center">
                             {authProviders.map(ap => {
                                 return (
                                     <button key={"button" + ap.host} className="btn-login flex-none w-56 h-10 p-0 inline-flex" onClick={() => openLogin(ap.host)}>
                                         {iconForAuthProvider(ap.authProviderType)}
                                         <span className="pt-2 pb-2 mr-3 text-sm my-auto font-medium truncate overflow-ellipsis">从 {simplifyProviderName(ap.host)} 继续</span>
                                     </button>
                                 );
                             })}
                         </div>

                         {errorMessage && (
                             <div className="mt-16 flex space-x-2 py-6 px-6 w-96 justify-between bg-gitpod-kumquat-light rounded-xl">
                                 <div className="pr-3 self-center w-6">
                                     <img src={exclamation} />
                                 </div>
                                 <div className="flex-1 flex flex-col">
                                     <p className="text-gitpod-red text-sm">{errorMessage}</p>
                                 </div>
                             </div>
                         )}

                     </div>
                 </div>
                 <div className="flex-none mx-auto h-20 text-center">
                     <span className="text-gray-400">
                         {/* By signing in, you agree to our <a className="learn-more hover:text-gray-600" target="gitpod-terms" href="https://www.gitpod.io/terms/">terms of service</a>. */}
                     </span>
                 </div>
             </div>

         </div>
     </div>);
 }
