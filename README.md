# Minio Cloudron App

This repository contains the Cloudron app package source for [Minio](http://www.minio.io/).

## Installation

[![Install](https://cloudron.io/img/button.svg)](https://cloudron.io/button.html?app=io.minio.cloudronapp)

or using the [Cloudron command line tooling](https://cloudron.io/references/cli.html)

```
cloudron install --appstore-id io.minio.cloudronapp
```

## Building

The app package can be built using the [Cloudron command line tooling](https://cloudron.io/references/cli.html).

```
cd minio-app

cloudron build
cloudron install
```

## Testing

The e2e tests are located in the `test/` folder and require [nodejs](http://nodejs.org/). They are creating a fresh build, install the app on your Cloudron, perform tests, backup, restore and test if the repos are still ok. The tests expect port 29418 to be available.

```
cd minio-app/test

npm install
export PATH=$PATH:node_modules/.bin
mocha --bail test.js
```

