# Twitch Angular Social Login

## Description
Discord social login extension for [@abacritt/angularx-social-login](https://github.com/abacritt/angularx-social-login) Angular Library.

## Installation

### Install via npm
```bash
npm i @abacritt/angularx-social-login @eugenmirce/anguarx-social-login-discord
```
Also installing the angularx-social-login module as it is a dependency.


### Import the module
Import the `angularx-social-login` modules needed for the social login.  
Add `SocialLoginModule` and `SocialAuthServiceConfig` in your `AppModule`. Then import the `DiscordLoginProvider` and then configure the `SocialLoginModule` with the `DiscordLoginProvider`.
```javascript
import {SocialLoginModule, SocialAuthServiceConfig} from '@abacritt/angularx-social-login';
import {DiscordLoginProvider} from '@eugenmirce/angularx-social-login-discord';

@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
    SocialLoginModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: DiscordLoginProvider.PROVIDER_ID,
            provider: new DiscordLoginProvider(
              'YOUR_CLIENT_ID',
              {
                redirectUri: 'YOUR_REDIRECT_URL',
                scopes: ['identity', 'email']
              }
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }],
    // other module configurations
})
export class AppModule { }
```

### Sign in with Twitch

```javascript

import { SocialAuthService } from "@abacritt/angularx-social-login";
import { DiscordLoginProvider } from "@eugenmirce/angularx-social-login-twitch";

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent {

  constructor(private authService: SocialAuthService) { }

  signInWithDiscord(): void {
    this.authService.signIn(DiscordLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.authService.signOut();
  }
}
```

### Specifying custom scopes
```javascript
const discordInitOptions: {
  redirectUri: 'YOUR_REDIRECT_URI',
  scopes: ['user:read:email'], // To get access to logged in user email information
  forceVerify: false, // Force the user to re-authorize on each login [default is false]
  responseType: 'token'; // Use token for implicit grant authentication flow that is the one supported
};
```
You can use them in the `AppModule`
```javascript
...
providers: [
  {
    id: DiscordLoginProvider.PROVIDER_ID,
    provider: new DiscordLoginProvider(
      'YOUR_CLIENT_ID', discordInitOptions
    )
  }
]
...
```