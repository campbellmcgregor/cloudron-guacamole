#!/usr/bin/env node

/* global describe, before, after, xit, it */
'use strict'

const execSync = require('child_process').execSync
const expect = require('expect.js')
const net = require('net')
const path = require('path')

const webdriver = require('selenium-webdriver')

const by = webdriver.By
const until = webdriver.until

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

if (!process.env.CLOUDRON_USERNAME || !process.env.CLOUDRON_PASSWORD) {
  console.log('CLOUDRON_USERNAME and CLOUDRON_PASSWORD env vars need to be set')
  process.exit(1)
}


describe('Application life cycle test', function () {
  this.timeout(0)

  const chrome = require('selenium-webdriver/chrome')
  let server
  const browser = new chrome.Driver()
  const username = process.env.CLOUDRON_USERNAME
  const password = process.env.CLOUDRON)PASSWORD

  before(function () {
    const seleniumJar = require('selenium-server-standalone-jar')
    const SeleniumServer = require('selenium-webdriver/remote').SeleniumServer
    server = new SeleniumServer(seleniumJar.path, {port: 4444})
    server.start()
  })

  after(function () {
    browser.quit()
    server.stop()
  })

  const LOCATION = 'test'
  const TEST_TIMEOUT = parseInt(process.env.TIMEOUT, 10) || 20000
  let app

  function waitForElement (elem) {
    return browser.wait(until.elementLocated(elem), TEST_TIMEOUT)
      .then(() => browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT))
  }

  function getAppInfo () {
    const inspect = JSON.parse(execSync('cloudron inspect'))
    app = inspect.apps.filter(a => a.location === LOCATION || a.location === LOCATION + '2')[0]
    expect(app).to.be.an('object')
  }

  function login () {
    return browser.manage().deleteAllCookies()
      .then(() => browser.get('https://' + app.fqdn))
      .then(() => browser.wait(until.elementLocated(by.id('email')), TEST_TIMEOUT))
      .then(() => browser.findElement(by.id('email')).sendKeys(username))
      .then(() => browser.findElement(by.id('password')).sendKeys(password))
      .then(() => browser.findElement(by.tagName('form')).submit())
  }

  function logout () {
    browser.get('https://' + app.fqdn)
    return browser.findElement(by.id('logoutButton')).click() //THIS NEEDS TO BE A LINK FIND TO /logout, referenced only by the Text Logout (no tag/id)
      .then(() => waitForElement(by.id('loginButton')))
  }

  xit('build app', function () {
    execSync('cloudron build', {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('install app', function () {
    execSync('cloudron install --new --wait --location ' + LOCATION, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })

  it('can get app information', getAppInfo)
  it('can login', login)
  it('can logout', logout)

  it('can restart app', function () {
    execSync('cloudron restart --wait --app ' + app.id)
  })

  it('can login', login)
  it('can logout', logout)

  it('backup app', function () {
    execSync('cloudron backup create --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('restore app', function () {
    execSync('cloudron restore --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('can login', login)
  it('can logout', logout)

  it('move to different location', function () {
    execSync('cloudron configure --wait --location ' + LOCATION + '2 --app ' + app.id, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })
  it('can get new app information', getAppInfo)

  it('can login', login)
  it('can logout', logout)

  it('uninstall app', function () {
    execSync('cloudron uninstall --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  // test update (this test will only work after app is published)
  it('can install app', function () {
    execSync('cloudron install --new --wait --appstore-id io.cloudron.openvpn --location ' + LOCATION, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })

  it('can get app information', getAppInfo)
  it('can login', login)
  it('can logout', logout)

  it('can update', function () {
    execSync('cloudron install --wait --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('can login', login)
  it('can logout', logout)

  it('uninstall app', function () {
    execSync('cloudron uninstall --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })
})
