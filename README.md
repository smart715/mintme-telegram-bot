# Marketing Bot

The project is responsible for parsing crypto websites, parsing blockchain explorers, validate info and send marketing messages using twitter, email and telegram.
The project works with ETH, BNB and CRO cryptos and uses [console commands](#cli-commands) as endpoints.

## How it works
Node js server accepts cli commands that parse info from crypto websites and explorers and saves contact info and information about tokens.   
After that Email, Telegram and Twitter workers contacts with token's owners/support using token's info that was parsed.  
Detailed description about cli worker commands, see [cli commands](#cli-commands) section

## Production

### Requirements

* NodeJs >= 16
* MariaDB >= 10.9
* [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr)
* selenium-chrome
* selenium-hub

### Installation
Install FlareSolverr, selenium-chrome, selenium-hub.  
Make sure to configure all environment variables (you can find example in `.env` file).  
Additional settings
can be found in `config/*` files.

```shell
npm install
npm run typeorm migration:run
npm run start
```

## Development
Development requires Docker on your local machine  
Run Makefile to see all suitable actions

```shell
make
```

To start developing you will probably just need
```shell
make run
```
It will create a node server using docker compose with hot-reloading and deploy all necessary services from docker compose file

## Usage

Example cli command:
```bash
npm run cli -- run-fetch-token-worker --name=coin-gecko
```


## Cli commands
### Parse
#### `run-fetch-token-worker`
This cli commands parses info about tokens from different websites using api or selenium.

| Parameter | Notes                                                                                                                      |
|-----------|----------------------------------------------------------------------------------------------------------------------------|
| name      | Parser worker name from [CasualTokenWorkerNames](src/app/command/types.ts). Eg: `coin-cap`, `coin-gecko`, `top-100-tokens` |

#### `run-explorer-worker`
Parses token addresses and wallet addresses from explorers.

| Parameter  | Notes                                                                                                                                                                                                                                                               |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name       | Explorer worker name from [ExplorerWorkerNames](src/app/command/types.ts). Eg: `token-holdings-worker`, `token-transactions-fetcher`                                                                                                                                |
| blockchain | Optional. If not specified, check all blockchains. Specified Blockchain symbol should be from [Blockchain](src/utils/blockchains.ts). `ETH`, `CRO`, `BSC`, `MATIC`, `SOL` or NULL for some workers to check all blockchains. Check [Explorers descriptions](#explorers-description) |

#### **Explorers description**

| Explorer name                 | Description                                                                                                                                                                                                                                                            |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `token-transactions-fetcher`  | Accepts all blockchains.<br/> Fetches token transactions page from Explorers. <br/> Parses token addresses and wallet pages and add it to queuedWalletAddressService and queuedTokenAddressService.                                                                    |
| `top-accounts-fetcher`        | Accepts all blockchains. Fetches Top Accounts by crypto balance and saves wallet addresses.                                                                                                                                                                            |
| `top-tokens-fetcher`          | Accepts all blockchains. Fetches top tokens and saves token addresses.                                                                                                                                                                                                 |
| `validators-fetcher`          | Works only for BSC. Fetches Validators Top Leaderboard (Blocks Validated) page and saves all wallet addresses.                                                                                                                                                         |
| `check-token-worker`          | Accepts all blockchains. Fetches queued token addresses. Check for liquidity provider in page and if exists, parse info and adds or updates new token to the token table                                                                                               |
| `explorer-search-api-worker`  | Accepts all blockchains. Adds token addresses from API explorer to the queued token address.                                                                                                                                                                           |
| `token-holdings-worker`       | Accepts all blockchains. Runs bscScanAddressTokensHoldingsWorker (BSC, ETH and CRO runs the same worker)<br/> Checks tokens that have wallet from queued_wallet_address table. Parse it and adds it to queued_token_address table |

#### `run-last-token-tx-date-fetcher`
Fetches tokens without last transaction date. And update last transaction date in a loop using explorer api

### Contact

#### `run-enqueue-tokens-worker`
Fetches tokens from `token` table and tries to add it to queued_contact to contact it via email/twitter/telegram in future

| Parameter  | Notes                                                                              |
|------------|------------------------------------------------------------------------------------|
| blockchain | Blockchain symbol from [Blockchain](src/utils/blockchains.ts). `ETH`, `CRO`, `BSC`, `MATIC`, `SOL` |

#### `run-queue-worker`
Uses queued_contact table. Fetches row, check if token exists, remove it from queue if doesn't exist or contacts the token via email/twitter

| Parameter  | Notes                                                                              |
|------------|------------------------------------------------------------------------------------|
| blockchain | Blockchain symbol from [Blockchain](src/utils/blockchains.ts). `ETH`, `CRO`, `BSC`, `MATIC`, `SOL` |
| repeat     | Repeat run in `argument` seconds. Default value is `0`                             |

#### `run-mailer-worker`
Contacts with tokens using mailer. Runs in a loop with 5 mins sleep time if there is no tokens to contact

#### `run-telegram-worker`
Contacts with tokens using telegram and selenium. Uses proxy. Supports multi accounts. Accounts should be added to the `telegram_account` table

| Parameter  | Notes                                                                              |
|------------|------------------------------------------------------------------------------------|
| mode | Worker mode [TelegramWorkerMode](src/utils/telegram.ts)/ `all`, `responses`| 

#### `run-twitter-worker`
Contacts with tokens using twitter account and selenium. Supports multi accounts. Accounts should be added to the `twitter_account` table

### Helper

#### `run-daily-statistic-worker`
This command counts daily statistic and sends it using mailer to the provided email (`email_daily_statistic` parameter)

## Conduct of Developers / Documentation

Developers should follow the [layering systen](https://cs.uwaterloo.ca/~m2nagapp/courses/CS446/1195/Arch_Design_Activity/Layered.pdf).

*JS module system* - all directories are a separate modules that can share something outside only with
index file. You can think about it like a private/public members of namespace. It helps to achieve
incapsulation between layers.

*Layered Architect* - you split application with several logical modules. In our case `core` (domain/business), `app`,
`utils` (infrastructure + gateway). All layers can communicate with each other only using index file in the root of the layer.

Layers in details:

1) utils - something general. It could be some 3d-party library wrapper, http communicator, database
   connection establisher, etc.. This layer is an infrastructure of our project, any other
   layer can use it directly, but otherwise, you can't use any other layer here.
2) core - it's our domain/business/main part. It must include all things related to the cryptos,
   tokens, etc... It can use only utils as dependency. This module
   MUST be fully covered with tests
3) app - all stuff related to how we want to use our `core` logic. It can be HTTP server, console
   commands, AMQP API etc... This module is our entrypoint where you can use any other layer

That is how our communication between layers looks like
```shell
utils -> core -> app
      -> app
```


