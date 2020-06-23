# Guacamole Cloudron App

This repository contains the Cloudron app package source for [Guacamole](http://guacamole.incubator.apache.org/).


## Testing

The e2e tests are located in the `test/` folder and require [nodejs](http://nodejs.org/). They are creating a fresh build, install the app on your Cloudron, perform tests, backup, restore and test if the repos are still ok. The tests expect port 29418 to be available.

```
cd guacamole-app/test

npm install
export PATH=$PATH:node_modules/.bin
mocha --bail test.js
```

