![Cryb OSS](.github/portals-icon.png "@cryb/portals Logo")

**@cryb/portals** — _VM microservice_

[![GitHub contributors](https://img.shields.io/github/contributors/crybapp/portals)](https://github.com/crybapp/portals/graphs/contributors) [![License](https://img.shields.io/github/license/crybapp/portals)](https://github.com/crybapp/portals/blob/master/LICENSE) [![Patreon Donate](https://img.shields.io/badge/donate-Patreon-red.svg)](https://patreon.com/cryb) [![Chat on Discord](https://discord.com/api/guilds/594942455749672983/widget.png)](https://discord.gg/xdhEgD5)

## Docs

* [Info](#info)
  * [Status](#status)
* [Codebase](#codebase)
  * [Folder Structure](#folder-structure)
    * [Code Style](#code-style)
  * [First time setup](#first-time-setup)
    * [Installation](#installation)
  * [Running the app locally](#running-the-app-locally)
    * [Background services](#background-services)
    * [Starting @cryb/portals](#starting-@cryb/portals)
  * [Adding a custom provider](#adding-a-custom-provider)
* [Questions / Issues](#questions--issues)

## Info

`@cryb/portals` is the microservice used to handle requests `@cryb/api` to create and destroy 'Portals', which is the term we use for VM instances.

`@cryb/portal` instances also connect to `@cryb/portals` over WS to send and recieve updates like controller events and health updates.

### Status

`@cryb/portals` has been actively developed internally since September 2019, and is now open source as of October 2019.

## Codebase

The codebase for `@cryb/portals` is written in JavaScript, utilising TypeScript and Node.js. Express.js is used for our REST API, while the WebSocket API uses the `ws` module.

MongoDB is used as the primary database, while Redis is used for cache and PUB/SUB.

### Code Style

We ask that you follow our [code style guidelines](https://github.com/crybapp/library/blob/master/code-style/STYLE.md) when contributing to this repository.

We use TSLint in order to lint our code. Run `yarn lint` before committing any code to ensure it's clean.

**Note:** While we have most rules covered in our `tslint.json` config, it's good practice to familarise yourself with our code style guidelines.

### Folder Structure

```
cryb/portals/
└──┐ src # The core source code
   ├──┐ config # Config files for Redis, Passport, etc
   │  └── providers # Config files for the provider APIs, such as Google Cloud, Kubernetes, etc.
   ├── controllers # Our REST route controller files
   ├── drivers # Methods used to deploy Portal instances
   ├── models # Models for our a data types, such as portals and requests
   ├── schemas # Mongoose schema files
   ├── server # Our Express.js setup and WebSocket setup
   ├── services # Services such as queue management, etc
   └── utils # Helper methods
```

### First time setup

First, clone the `@cryb/portals` repository locally:

```
git clone https://github.com/crybapp/portals.git
```

#### Installation

The following services need to be installed for `@cryb/portals` to function:

* MongoDB
* Redis

We recommend that you run the following services alongside `@cryb/portals`, but they're not required.

* `@cryb/api`
* `@cryb/web`
* `@cryb/aperture`

You also need to install the required dependencies by running `yarn`.

Ensure that `.env.example` is either copied and renamed to `.env`, or is simply renamed to `.env`.

In this file, you'll need some values. Documentation is available in the `.env.example` file.

### Running the app locally

#### Background Services

Make sure that you have installed MongoDB and Redis, and they are both running locally on port 27017 and 6379 respectively.

The command to start MongoDB is `mongod`, and the command to start Redis is `redis-server`.

If you're developing a feature that requires the VM infrastructure, then make sure `@cryb/aperture` is running.

#### Starting @cryb/portals

To run `@cryb/portals` in development mode, run `yarn dev`.

It is recommended that in production you run `yarn build`, then `yarn start`.

### Adding a custom provider

`@cryb/portals` makes it easy to add a custom cloud provider to deploy Portal instances onto.

1. First, make a config file under `src/config/providers`. You want to call this `foo.config.ts`. This file should export a method that returns the API of the provider you want to use. See `example.config.ts` or `gcloud.config.ts` for an example of how Google Cloud intergration is handled.
2. Next, make a file under `src/drivers`. You want to call this `foo.driver.ts`. You can copy the code in `example.driver.ts` as a starting point.
3. Import your `foo.config.ts` file then create an instance of the client using the `createClient` method exported in the config file.
4. Then add the code to create a cloud deployment with the desired config under the `try {` clause in the `openPortalInstance` method.
5. *Optional, but recommended* Add the method under the `try {` clause in `closePortalInstance` to destroy the VM instance. This will be called when a Room no longer needs a portal, such as when all members have gone offline.
6. Now, under `src/drivers/router.ts`, import your driver and rename its methods so they don't conflict when any other drivers. See below:
```ts
import {
    openPortalInstance as openFooPortalInstance,
    closePortalInstance as closeFooPortalInstance
} from './foo.driver'
```
7. *If you're not using TypeScript, skip this step* Make sure you have added the name of your driver to the `Driver` type. See below:
```ts
type Driver = 'gcloud' | 'kubernetes' | 'foo'
```
8. Add a `case` to the `switch` statement under `openPortalInstance` with the name of your driver methods. See below:
```ts
switch(driver) {
    ...
    case 'foo':
        openFooPortalInstance(portal)
        break
}
```
9. *Optional, but recommended* If you added a `closePortalInstance` handler in your driver, add a `case` to the `switch` statement under `closePortalInstance` with the name of your driver methods. See below:
```ts
switch(driver) {
    ...
    case 'foo':
        closeFooPortalInstance(portal)
        break
}
```
10. Make sure you change the current driver under `fetchCurrentDriver`. See below:
```ts
const fetchCurrentDriver = () => 'foo' as Driver
```

Done! Enjoy using `@cryb/portals` with the cloud provider of your preferred choice. For any help, view [here](#questions-/-issues). If you're feeling generous, create a [PR request](https://github.com/crybapp/portals) with your driver so the community can use it. Be sure to follow our [Guidelines](https://github.com/crybapp/guidelines) before submitting a PR.

## Questions / Issues

If you have an issues with `@cryb/portals`, please either open a GitHub issue, contact a maintainer or join the [Cryb Discord Server](https://discord.gg/xdhEgD5) and ask in `#tech-support`.

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcrybapp%2Fportals.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcrybapp%2Fportals?ref=badge_large)
