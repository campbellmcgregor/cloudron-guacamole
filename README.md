# Guacamole Cloudron App

This repository contains the Cloudron app package source for [Guacamole](http://guacamole.incubator.apache.org/).

## Installation

[![Install](https://cloudron.io/img/button.svg)](https://cloudron.io/button.html?app=org.apache.incubator.guacamole.cloudronapp)

or using the [Cloudron command line tooling](https://git.cloudron.io/cloudron/cloudron-cli/)

```
cloudron install --appstore-id org.apache.incubator.guacamole
```

## Building

The app package can be built using the [Cloudron command line tooling](https://git.cloudron.io/cloudron/cloudron-cli/).

```
cd guacamole-app

cloudron build
cloudron install
```

## Testing

The e2e tests are located in the `test/` folder and require [nodejs](http://nodejs.org/). They are creating a fresh build, install the app on your Cloudron, perform tests, backup, restore and test if the repos are still ok. The tests expect port 29418 to be available.

```
cd guacamole-app/test

npm install
export PATH=$PATH:node_modules/.bin
mocha --bail test.js
```

