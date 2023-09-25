# Marketing Bot

Project responsible for parsing crypto websites, parsing blockchain explorers, validate info and send marketing messages using twitter, email and telegram.
The project works with ETH, BNB and CRO cryptos.

## Production

### Requirements

* **NodeJs** >= 16
* **MariaDB** >= 10.9
* [**FlareSolverr**](https://github.com/FlareSolverr/FlareSolverr)
* **selenium-chrome**
* **selenium-hub**

### Installation
Install FlareSolverr, selenium-chrom, selenium-hub.  
Make sure to configure all environment variables (you can find example in `.env` file).  
Additional settings
can be found in `config/*` files.

```shell
npm install
npm run typeorm migration:run
npm run start
```

## Development

Run Makefile to see all suitable actions

```shell
make
```

To start developing you will probably need just
```shell
make run
```
It will create a node server using docker compose with hot-reloading.

### Conduct of Developers / Documentation

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


