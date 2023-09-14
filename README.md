# Marketing Bot
Project responsible for parsing crypto websites, validate info and send marketing messages using twitter, email and telegram.

## Production

### Requirements

* NodeJs >= 16
* MariaDB >= 10.9
* FlareSolverr
* selenium-chrome
* selenium-hub

### Installation

Make sure to configure all environment variables (you can find example in `.env` file). Additional settings
can be found in `config/*` files.

```shell
npm install
npm run typeorm migration:run
npm run start
```

## Development
