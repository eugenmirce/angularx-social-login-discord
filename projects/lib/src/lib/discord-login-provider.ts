import {BaseLoginProvider, SocialUser} from '@abacritt/angularx-social-login';
import {HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import {UtilsService} from './utils.service';

export interface DiscordInitOptions {
    /**
     * Your app’s registered redirect URI. The access token is sent to this URI.
     * Make sure they match or the authentication will not work.
     */
    redirectUri: string;
    /**
     * Set to true to force the user to re-authorize your app’s access to their resources.
     */
    prompt?: 'none' | 'consent';
    /**
     * A list of scopes. The APIs that you’re calling identify the scopes you must list.
     */
    scopes: string | string[];
}

export class DiscordLoginProvider extends BaseLoginProvider {

    public static readonly PROVIDER_ID: string = 'DISCORD';

    private static readonly DISCORD_AUTH_URL: string = 'https://discord.com/oauth2/authorize';
    private static readonly DISCORD_REVOKE_TOKEN: string = 'https://discord.com/api/v13/oauth2/token/revoke';
    private static readonly DISCORD_USER_URL: string = 'https://discordapp.com/api/users/@me';

    constructor(
        private clientId: string,
        private readonly initOptions: DiscordInitOptions,
    ) {
        super();
    }

    initialize(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Gets the logged in socialUser details
     * @returns SocialUser
     */
    getLoginStatus(): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();
            if (accessToken) {
                this.getUserInformation(accessToken).then(user => {
                    resolve(user);
                }, (error) => {
                    this.clearToken();
                    reject(error)
                });
            } else {
                reject(`No user is currently logged in with ${DiscordLoginProvider.PROVIDER_ID}`);
            }
        });
    }

    /**
     * Opens the popup window for Discord authentication
     * @returns SocialUser
     */
    signIn(): Promise<SocialUser> {
        return new Promise(async (resolve, reject) => {
            const popupWidth = 500;
            const popupHeight = 600;
            const left = window.screen.width / 2 - popupWidth / 2;
            const top = window.screen.height / 2 - popupHeight / 2;

            const popupWindow = window.open(
                this.getAuthorizationUrl(),
                'discord-popup',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`);

            if (popupWindow) {
                const checkAccessToken = setInterval(() => {
                    try {
                        if (popupWindow.closed) {
                            clearInterval(checkAccessToken);
                            reject('Discord authentication window was closed.');
                        }

                        if (popupWindow.location.origin === window.location.origin) {
                            clearInterval(checkAccessToken);
                            popupWindow.close();

                            const hash = popupWindow.location.hash;
                            if (hash) {
                                const urlParams = new URLSearchParams(hash.replace('#', '?'));
                                const accessToken = urlParams.get('access_token');

                                if (accessToken) {
                                    this.persistToken(accessToken);
                                    this.getUserInformation(accessToken)
                                        .then((socialUser) => {
                                            this.persistToken(accessToken);
                                            resolve(socialUser);
                                        })
                                        .catch((error) => {
                                            reject(error);
                                        });
                                } else {
                                    reject('Discord authentication failed.');
                                }
                            } else {
                                //If no hash was found than probably an error might have happened
                                const urlParams = new URLSearchParams(popupWindow.location.search);
                                if (urlParams.get('error')) {
                                    reject(`Discord authentication failed: ${urlParams.get('error_description')}`);
                                }
                            }
                        }
                    } catch (error: any) {
                        const errorMessage = error.toString();
                        //Ignore the blocked a frame since it happens because of Cross Origin requests
                        if (!errorMessage.includes('Blocked a frame with origin')) {
                            reject(`Discord authentication failed: ${errorMessage}`);
                            clearInterval(checkAccessToken);
                            popupWindow.close();
                        }
                    }
                }, 100);
            } else {
                reject('Unable to open Discord authentication popup window.');
                return;
            }
        });
    }

    /**
     * Logout user and revoke token
     */
    signOut(): Promise<void> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();
            if (accessToken) {
                this.clearToken();
                resolve();
            } else {
                reject(`No user is currently logged in with ${DiscordLoginProvider.PROVIDER_ID}`);
            }
        })
    }

    /**
     * Get user details from Discord
     * @param accessToken the accessToken
     * @returns SocialUser
     */
    private getUserInformation(accessToken: string): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders()
                .set('Authorization', 'Bearer ' + accessToken);

            UtilsService.sendRequest(DiscordLoginProvider.DISCORD_USER_URL, 'GET', headers)
                .then(response => {
                    const socialUser = {
                        provider: DiscordLoginProvider.PROVIDER_ID,
                        id: response.id,
                        name: response.username,
                        email: response.email,
                        authToken: accessToken,
                        idToken: '',
                        authorizationCode: '',
                        photoUrl: '',
                        firstName: '',
                        lastName: '',
                        response: '',
                    }
                    resolve(socialUser);
                }, error => {
                    reject(error);
                })
        });
    }

    /**
     * Save token in localStorage
     * @param token the accessToken
     */
    persistToken(token: string) {
        localStorage.setItem(`${DiscordLoginProvider.PROVIDER_ID}_token`, token);
    }

    /**
     * Retrieve token from localStorage
     * @returns String
     */
    retrieveToken() {
        return localStorage.getItem(`${DiscordLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Remove token from localStorage
     */
    clearToken() {
        localStorage.removeItem(`${DiscordLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Constructs the authorization url with the needed and optional parameters
     * @returns String
     */
    private getAuthorizationUrl(): string {
        let scope;
        if (Array.isArray(this.initOptions.scopes)) {
            scope = this.initOptions.scopes.join(' ');
        } else {
            scope = this.initOptions.scopes;
        }
        const params = new HttpParams()
            .set('client_id', this.clientId)
            .set('consent', this.initOptions.prompt || 'none')
            .set('redirect_uri', this.initOptions.redirectUri)
            .set('response_type', 'token')
            .set('scope', scope);
        let request = new HttpRequest('GET', DiscordLoginProvider.DISCORD_AUTH_URL, null, {params});

        return request.urlWithParams;
    }
}