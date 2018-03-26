#!/usr/bin/env node
'use strict'

/* global describe, after, xit, it */

require('chromedriver')

const execSync = require('child_process').execSync
const expect = require('expect.js')
// const net = require('net')
const path = require('path')

const selenium = require('selenium-webdriver')

const {By, until} = selenium

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
selenium.promise.USE_PROMISE_MANAGER = false

describe('Application life cycle test', function () {
  this.timeout(0)

  const chrome = require('selenium-webdriver/chrome')
  const browser = new selenium.Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().addArguments(['no-sandbox']))
    .build()
  const username = 'guacadmin'
  const password = 'guacadmin'

  after(function () {
    browser.quit()
  })

  const LOCATION = 'test'
  const TEST_TIMEOUT = parseInt(process.env.TIMEOUT, 10) || 20000
  let app

  function waitForElement (elem) {
    return browser.wait(until.elementLocated(elem), TEST_TIMEOUT)
      .then(() => browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT))
  }

  function assertElementText (elem, supposedText) {
    return browser.findElement(elem).getText()
      .then(text => {
        if (text === supposedText) return true
        else throw new Error(`Assertion error. Expected text '${supposedText}'. Got '${text}.'`)
      })
  }

  function getAppInfo () {
    const inspect = JSON.parse(execSync('cloudron inspect'))
    app = inspect.apps.filter(a => a.location === LOCATION || a.location === LOCATION + '2')[0]
    expect(app).to.be.an('object')
  }

  function login () {
    return browser.manage().deleteAllCookies()
      .then(() => browser.get('https://' + app.fqdn))
      .then(() => waitForElement(By.id('email')))
      .then(() => browser.findElement(By.id('email')).sendKeys(email))
      .then(() => browser.findElement(By.id('password')).sendKeys(password))
      .then(() => browser.findElement(By.xpath('//button[text()="Login"]')).click())
      .then(() => waitForElement(By.xpath('//h2[text()="Welcome to your account!"]')))
  }

  function checkSettings () {
    #HERE WE CAN CREATE A SUMMY CONNECTION TO CHECK IF IT LIVES POST RESTORE
    return browser.get('https://' + app.fqdn + '/journal/add')
      .then(() => waitForElement(By.id('field-entry')))
      .then(() => browser.findElement(By.id('field-entry')).sendKeys('Gin and tonic'))
      .then(() => browser.findElement(By.xpath('//button[text()="Save"]')).click())
  }


  it('install app', function () {
    execSync('cloudron install --new --wait --location ' + LOCATION, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })

  it('can get app information', getAppInfo)

  it('can login', login)

  it('can restart app', function () {
    execSync('cloudron restart --wait --app ' + app.id)
  })

  it('can login', login)
  it('check setting', checkSettings)

  it('backup app', function () {
    execSync('cloudron backup create --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('restore app', function () {
    execSync('cloudron restore --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  it('can login', login)
  it('check settings', checkSettings)

  it('move to different location', function () {
    execSync('cloudron configure --wait --location ' + LOCATION + '2 --app ' + app.id, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })
  it('can get new app information', getAppInfo)

  it('can login', login)
  it('check settings', checkSettings)

  it('uninstall app', function () {
    execSync('cloudron uninstall --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })

  // test updates
  it('can install app', function () {
    execSync('cloudron install --new --wait --appstore-id com.monicahq.cloudronapp --location ' + LOCATION, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    })
  })
 
  it('can get app information', getAppInfo)
  it('can login', login)
  it('check settings', checkSettings)
 
  it('can update', function () {
    execSync('cloudron install --wait --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })
 
  it('can login', login)
  it('check settings', checkSettings)
 
  it('uninstall app', function () {
    execSync('cloudron uninstall --app ' + app.id, {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
  })
})


