#!/usr/bin/env node

'use strict';

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    webdriver = require('selenium-webdriver');

var by = webdriver.By,
    until = webdriver.until;

var accessKey = 'admin',
    secretKey = 'secretkey';

var bucket_prefix = 'bucket',
    bucket_id = 0,
    bucket;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


describe('Application life cycle test', function () {
    this.timeout(0);

    var chrome = require('selenium-webdriver/chrome');
    var server, browser = new chrome.Driver();

    before(function (done) {
        var seleniumJar= require('selenium-server-standalone-jar');
        var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
        server = new SeleniumServer(seleniumJar.path, { port: 4444 });
        server.start();

        done();
    });

    after(function (done) {
        browser.quit();
        server.stop();
        done();
    });

    var LOCATION = 'minio-test';
    var TEST_TIMEOUT = 10000;
    var app;

    function pageLoaded(callback) {
        return browser.wait(until.elementLocated(by.className('page-load pl-0 pl-1')), TEST_TIMEOUT).then(function () {
            callback();
        });
    }

    function visible(selector, callback) {
        return browser.wait(until.elementLocated(selector), TEST_TIMEOUT).then(function () {
            browser.wait(until.elementIsVisible(browser.findElement(selector)), TEST_TIMEOUT).then(function () {
                callback();
            });
        });
    }

    function login(callback) {
        browser.manage().deleteAllCookies();
        browser.get('https://' + app.fqdn);

        visible(by.id('accessKey'), function () {
            browser.findElement(by.id('accessKey')).sendKeys(accessKey);
            browser.findElement(by.id('secretKey')).sendKeys(secretKey);
            browser.findElement(by.className('lw-btn')).click();
            browser.wait(until.elementLocated(by.id('top-right-menu')), TEST_TIMEOUT).then(function () { callback(); });
        });
    }

    function logout(callback) {
        browser.get('https://' + app.fqdn);

        pageLoaded(function () {
            visible(by.id('top-right-menu'), function () {
                browser.findElement(by.id('top-right-menu')).click();
                visible(by.xpath('//*[text()="Sign Out "]'), function () {
                    browser.findElement(by.xpath('//*[text()="Sign Out "]')).click();

                    browser.wait(until.elementLocated(by.id('accessKey')), TEST_TIMEOUT).then(function () { callback(); });
                });
            });
        });
    }

    function addBucket(callback) {
        bucket_id = bucket_id + 1;
        bucket = bucket_prefix + bucket_id;
        browser.get('https://' + app.fqdn);

        pageLoaded(function () {
            visible(by.className('fa fa-plus'), function () {
                browser.findElement(by.className('fa fa-plus')).click();
                visible(by.className('fa fa-hdd-o'), function () {
                    browser.findElement(by.className('fa fa-hdd-o')).click();
                    visible(by.xpath('//*[@class="modal-body"]/form/div/input'), function() {
                        browser.findElement(by.xpath('//*[@class="modal-body"]/form/div/input')).sendKeys(bucket);
                        browser.findElement(by.xpath('//*[@class="modal-body"]/form')).submit();
                        visible(by.xpath('//*[@class="main"]/a[text()="' + bucket + '"]'), function() {
                            callback();
                        });
                    });
                });
            });
        });
    }

    xit('build app', function () {
        execSync('cloudron build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('install app', function () {
        execSync('cloudron install --new --wait --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can get app information', function () {
        var inspect = JSON.parse(execSync('cloudron inspect'));

        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];

        expect(app).to.be.an('object');
    });

    it('can login', login);
    it('can add buckets', addBucket);
    it('can logout', logout);

    it('backup app', function () {
        execSync('cloudron backup create --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('restore app', function () {
        execSync('cloudron restore --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can login', login);
    it('can add buckets', addBucket);
    it('can logout', logout);

    it('move to different location', function () {
        browser.manage().deleteAllCookies();
        execSync('cloudron install --location ' + LOCATION + '2', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location === LOCATION + '2'; })[0];
        expect(app).to.be.an('object');
    });

    it('can login', login);
    it('can add buckets', addBucket);
    it('can logout', logout);

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

});
