/**
 * @license
 * Copyright 2013 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Unit tests for the Compose Glass.
 */

/** @suppress {extraProvide} */
goog.provide('e2e.ext.ui.ComposeGlassTest');

goog.require('e2e.ext.Launcher');
goog.require('e2e.ext.constants');
goog.require('e2e.ext.constants.ElementId');
goog.require('e2e.ext.testingstubs');
goog.require('e2e.ext.ui.ComposeGlass');
goog.require('e2e.ext.utils');
goog.require('e2e.ext.utils.text');
/** @suppress {extraRequire} intentionally importing all signer functions */
goog.require('e2e.signer.all');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');
goog.require('goog.testing.mockmatchers.ArgumentMatcher');

goog.setTestOnly();

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
asyncTestCase.stepTimeout = 2000;

var constants = e2e.ext.constants;
var mockControl = null;
var composeglass = null;
var launcher = null;

var stubs = new goog.testing.PropertyReplacer();
var ORIGIN = 'https://us-mg5.mail.yahoo.com';
var USER_ID_2 = 'Drew Hintz <adhintz@google.com>';
var USER_ID = 'test 4';
var draft = {body: 'plaintext message',
    to: [USER_ID, USER_ID_2], from: USER_ID};


function setUp() {
  window.localStorage.clear();
  mockControl = new goog.testing.MockControl();
  e2e.ext.testingstubs.initStubs(stubs);
  stubs.replace(e2e.ext.utils.text, 'extractValidEmail', function(recipient) {
    if (recipient == USER_ID) {
      return recipient;
    } else if (recipient == USER_ID_2){
      return 'adhintz@google.com';
    }
    return null;
  });

  composeglass = new e2e.ext.ui.ComposeGlass(draft, 'resize', ORIGIN, 'foo');
  launcher = new e2e.ext.Launcher();
  launcher.start();

  stubs.replace(e2e.ext.utils, 'sendProxyRequest', goog.nullFunction);

  stubs.setPath('chrome.runtime.getBackgroundPage', function(callback) {
    callback({launcher: launcher});
  });

  stubs.replace(e2e.ext.utils, 'sendExtensionRequest', function(args, cb) {
    cb = cb || goog.nullFunction;
    launcher.ctxApi_.executeAction_(cb, args);
  });

  stubs.replace(e2e.ext.Launcher.prototype, 'hasPassphrase', function() {
    return true;
  });
}


function tearDown() {
  stubs.reset();
  mockControl.$tearDown();
  composeglass.dispose();
  goog.dispose(composeglass);
}


var PRIVATE_KEY_ASCII =
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
    'Version: GnuPG v1.4.11 (GNU/Linux)\n' +
    '\n' +
    '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\n' +
    '1KwNtVw=\n' +
    '=wHzz\n' +
    '-----END PGP PRIVATE KEY BLOCK-----';


var PUBLIC_KEY_ASCII =
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    'Version: GnuPG v1.4.11 (GNU/Linux)\n' +
    '\n' +
    'mI0EUcy6DgEEAJb0T7gQlfKQWmR0dLUrueRMVy8UemcmxsdIH30/HqJvqO6xU0lK\n' +
    'NaFtaVxBdenAMpEooi1EcTi/bOKfz36FY/FARTiXv1LXuLzFJdPyjTYjh7tw+uOP\n' +
    'UlLJCTZikgrnM07txTUiVVEetOa+unyKn17EX0PlSpAbGZedyO0nGwXzABEBAAG0\n' +
    'BnRlc3QgNIi4BBMBAgAiBQJRzLoOAhsDBgsJCAcDAgYVCAIJCgsEFgIDAQIeAQIX\n' +
    'gAAKCRAG/5ysCS2oCL2SA/9EV9j3T/TM3VRD0NvNySHodcxCP1BF0zm/M84I/WHQ\n' +
    'sGKmHStfCqqEGruB8E6NHQMJwNp1TzcswuxE0wiTJiXKe3w3+GZhPHdW5zcgiMKK\n' +
    'YLn80Tk6fUMx1zVZtXlSBYCN5Op/axjQRyb+fGnXOhmboqQodYaWS7qhJWQJilH6\n' +
    'iriNBFHMug4BBADDTMshHtyYhLmWC7793FlOFl5tkcEfdFKJRm30k/9yky4cuz//\n' +
    'Xe4uXM72SaTI1Dfi6UIz5ZuFTxw3bnAXav+SV4Q4dZo0hb4jU8YaQfDL4TsRp7uO\n' +
    '6iqxd8nlsh9JnBKE6Fk/CW5FoMZZ3/yEm3pq924Uv2AZlO6dafgXecyqNQARAQAB\n' +
    'iJ8EGAECAAkFAlHMug4CGwwACgkQBv+crAktqAhENwQAkMY/nds36KgzwfMPpxtB\n' +
    'aq8GbrUqY1r8lBl6a/bi8qeOuEgQmIxM2OpVPtL04c1c1hLflPCi1SQUlCIh3DkE\n' +
    'GQIcy0/wxUZdCvZK0mF5nZSq6tez3CwqbeOA4nBOLwbxho50VqxBpR4qypYrB2ip\n' +
    'ykxlwiqudEe0sE2b1KwNtVw=\n' +
    '=nHBL\n' +
    '-----END PGP PUBLIC KEY BLOCK-----';


var PUBLIC_KEY_ASCII_2 =  // user ID of 'Drew Hintz <adhintz@google.com>'
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    'Charset: UTF-8\n' +
    '\n' +
    'xv8AAABSBFP3bHYTCCqGSM49AwEHAgMECt6MVqa43Ab248CosK/cy664pkL/9XvC\n' +
    '0O2K0O1Jh2qau7ll3Q9vssdObSwX0EaiMm4Dvegxr1z+SblWSFV4x83/AAAAH0Ry\n' +
    'ZXcgSGludHogPGFkaGludHpAZ29vZ2xlLmNvbT7C/wAAAGYEEBMIABj/AAAABYJT\n' +
    '92x2/wAAAAmQ8eznwfj7hkMAADA9AQCWE4jmpmA5XRN1tZduuz8QwtxGZOFurpAK\n' +
    '6RCzKDqS8wEAx9eBxXLhKB4xm9xwPdh0+W6rbsvf58FzKjlxrkUfuxTO/wAAAFYE\n' +
    'U/dsdhIIKoZIzj0DAQcCAwQ0M6kFa7VaVmt2PRdOUdZWrHp6CZZglTVQi1eyiXB/\n' +
    'nnUUbH+qrreWTD7W9RxRtr0IqAYssLG5ZoWsXa5jQC3DAwEIB8L/AAAAZgQYEwgA\n' +
    'GP8AAAAFglP3bHf/AAAACZDx7OfB+PuGQwAAkO4BALMuXsta+bCOvzSn7InOs7wA\n' +
    '+OmDN5cv1cR/SsN5+FkLAQCmmBa/Fe76gmDd0RjvpQW7pWK2zXj3il6HYQ2NsWlI\n' +
    'bQ==\n' +
    '=LlKd\n' +
    '-----END PGP PUBLIC KEY BLOCK-----';

var PUBLIC_KEY_ASCII_2_EVIL = // Evil Drew Hintz <adhintz@google.com.evil.com>
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    'Version: GnuPG v1.4.11 (GNU/Linux)\n' +
    '\n' +
    'mI0EU7FngwEEALi4HSlK9DJuYUS7zEuJpi2RVdTE0zDQwyX7xLCERZLrPVWUHH0x\n' +
    'XO9X7X6ngA2qNQVUirMsGK/OOwTwzN0ywmETmHJCjx7cPqruSxD+BsnceiHRWc7m\n' +
    'FCJSP7Vl7BQUp16sbryT8dOpXmc+72ftxPahDJ0WWKSebXYVvvcJM8cLABEBAAG0\n' +
    'MkxpbnVzIFRvcndhbGRzIDxMaW51cy5Ub3J3YWxkczFAY2FyYW1haWwuY29tLmV2\n' +
    'aWw+iLgEEwECACIFAlOxZ4MCGwMGCwkIBwMCBhUIAgkKCwQWAgMBAh4BAheAAAoJ\n' +
    'EMBeGa5IppzDSFoD/0KGrjnLynrzOD7ZZRCL6jcv/YXR0PCgmyko94njmozfupmp\n' +
    'his/9Nw6EChGC1WigwmgOYXzy/fynnts1YlPSQQJpbDt1XIOkm0dmSKSI+/zNxGm\n' +
    'BZqstDLEdUPLt7HZecz5iTbEh3NDpz8nhiHiiIq0rMN0f67+vFpsfLQLtvw7tDVM\n' +
    'aW51cy5Ub3J3YWxkczFAY2FyYW1haWwuY29tLmV2aWwyIDxhbm90aGVyQGV2aWwu\n' +
    'Y29tPoi4BBMBAgAiBQJTsWmqAhsDBgsJCAcDAgYVCAIJCgsEFgIDAQIeAQIXgAAK\n' +
    'CRDAXhmuSKacw7C+A/988WuUl7PzBjIDiCEjffe/fC4gNP7viRRQhwvh8QSgNpXl\n' +
    '9TQ4PcKQRZvfNJk+OQvHMoPa+qXAB91GQg/nzYcFwKrsiy+wddAc/SbL0ClT5EEG\n' +
    'hy2DzvuOHoTK51O+RwaHP08jciQIeLC0BRJEMsuxK86j9vlUEWAEP9uPEiUvobiN\n' +
    'BFOxZ4MBBADDAzzpcIhOslSqULxjSdhQH0y8DK8GgbsCeIxf8iGIFNHEbOzUUZKV\n' +
    'IITTBjQVZS/2enkE+UOpVZUp2SgJogEbxstjeE7NofWNqeDGye01dfGDOyjc1Se/\n' +
    'WwHbxendlFpjZ8iHAjza4Bws2SsgCYYx0vfB8yruDnj9B299xXevLQARAQABiJ8E\n' +
    'GAECAAkFAlOxZ4MCGwwACgkQwF4ZrkimnMMPnwP+J/cbZK5eR0v6Y9VI2uA6GW7T\n' +
    'vILwfV3mUki9a5ag0XhL1xQWJSEBSLvNJac8/Cpc80yUpXvmvBhoefZSzzcR00pN\n' +
    'RyfyHLU6nEU7LDvQlN3TPpuctRhrLEnn4pMhgvIxDRLKcR1JtZ9ikcYI9pC9ywx7\n' +
    'YjNmsSc84KVYhDqIn6eZAaIEU7GElxEEAIbLqIgY+O3NLfNYp5da8c5hnPdMprOP\n' +
    '2dzL7d0ay6LsuaAcXSq4yaOa/WOAL64kFdX+I40sV21nQZ/gYB6OFT/qk3WtKepE\n' +
    'L6lc9iZULbVL9H14UOFAetYrmO53YetFpJZVCnsVBw7GRhOLV31oXldouh2a2NjC\n' +
    'r+5By/EaP2ADAKDxqlytOJwCJ+sWP0PGnjONb4zOdQP/X15UGQbmsDIm/iY3yPQe\n' +
    'FJjqMX0dKUJxB5cpVhBg2R4JZLCuDiN+3xC7/bcyZzUlaU7axt1/KvwighAnZrBD\n' +
    'Z6RbbPdCOf+KtSifQvNSrAOk8AhRrUN+sGc/fLSotsBPXcXYSR6bm/fzRKtcmV7U\n' +
    '95dkYanPy2rGG/HfB+opWrED/ic1Ib28DNReZ/xvbJicm2YDda8SyemX8g4/Qrir\n' +
    'oqtXeOIyHyOeZQoFk+W5sIXy1t8lM8isYNctKdvuSPjaZbTD//bI2r2T1Sc/nwoy\n' +
    'LupRcNH2oSfZ/4idPzCNdyHEDhzzNw1m8LQO1x5a2FJGJgaF8JCiNeNT8m65b/Uq\n' +
    'myw7tC1FdmlsIERyZXcgSGludHogPGFkaGludHpAZ29vZ2xlLmNvbS5ldmlsLmNv\n' +
    'bT6IYgQTEQIAIgUCU7GElwIbAwYLCQgHAwIGFQgCCQoLBBYCAwECHgECF4AACgkQ\n' +
    'qFdA2mzeclR1qwCg0a+61ZBPYdopFg8cwUjsDnFVvUAAoNun2cB7omK05P3URbVf\n' +
    'HEWI4RSPuQENBFOxhJcQBAC/SptM2I3+1ktGrhVHTkSU0C7/hiKWqKKg4lrQe0VR\n' +
    'GPi4SBc2stjS5HhBhDb+fBl3K+IiqDh8yCHxtXJeenrOutklMSfl89hDWLQefgrU\n' +
    'zZ3VX3llAs4DDjxF7ppEAraHM6GpPm+oEXeOuThBAqOkstT53IehTspiqnoouKgu\n' +
    'PwAECwQAmBGvx+TYOhEajpexobauc8yTACFwhYiwx7XK4+LGRenRJMY9/oGMb4/r\n' +
    'L4DLA4kosrzvblbGFLOsj/MtN2HZZIjekVqEpLqNULX8WfwO4ku+ahRCT+qOQe5x\n' +
    '9dHXUgr+ZRFtAkhxdMIF6Yh3eH7aSYZYkbUUaxtRSPsNfDe1Xh2ISQQYEQIACQUC\n' +
    'U7GElwIbDAAKCRCoV0DabN5yVIa4AKCwMqovxeUL8m2D7aWMZBLYG5Bb2wCfVpwq\n' +
    'x4imzBK+e4+YnAiNVhYYEJY=\n' +
    '=lo5W\n' +
    '-----END PGP PUBLIC KEY BLOCK-----';


function testRender() {
  populatePgpKeys(PUBLIC_KEY_ASCII_2);
  composeglass.decorate(document.documentElement);
  asyncTestCase.waitForAsync('Waiting for keys to be imported');
  var textarea = document.querySelector('textarea');
  window.setTimeout(function() {
    textarea.focus();
    assertArrayEquals(['test 4', 'adhintz@google.com'],
                      composeglass.allAvailableRecipients_);
    assertEquals(USER_ID,
                 goog.dom.getElement(constants.ElementId.SIGNER_SELECT).value);
    asyncTestCase.continueTesting();
  }, 100);
}


function testRenderWithMissingRecipient() {
  populatePgpKeys();
  stubs.replace(composeglass, 'fetchKeys_', function(cb) {
    cb([], ['adhintz@google.com']);
  });
  composeglass.decorate(document.documentElement);
  asyncTestCase.waitForAsync('Waiting for keys to be imported');
  var textarea = document.querySelector('textarea');
  window.setTimeout(function() {
    textarea.focus();
    assertArrayEquals(['test 4'],
                      composeglass.allAvailableRecipients_);
    var dialog = goog.dom.getElement('callbackDialog');
    assertContains('adhintz@google.com', dialog.textContent);
    asyncTestCase.continueTesting();
  }, 100);
}


function testRenderAndImportKey() {
  populatePgpKeys();
  stubs.replace(composeglass, 'fetchKeys_', function(cb) {
    populatePgpKeys(PUBLIC_KEY_ASCII_2);
    cb(['adhintz@google.com'], []);
  });
  composeglass.decorate(document.documentElement);
  asyncTestCase.waitForAsync('Waiting for keys to be imported');
  var textarea = document.querySelector('textarea');
  window.setTimeout(function() {
    textarea.focus();
    window.setTimeout(function() {
      assertArrayEquals(['test 4', 'adhintz@google.com'],
                        composeglass.allAvailableRecipients_);
      asyncTestCase.continueTesting();
    }, 100);
  }, 100);
}


function testEncrypt() {
  populatePgpKeys(PUBLIC_KEY_ASCII_2);
  stubs.replace(composeglass, 'insertMessageIntoPage_',
                mockControl.createFunctionMock('insertMessageIntoPage_'));
  composeglass.insertMessageIntoPage_(
      goog.testing.mockmatchers.ignoreArgument,
      new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
        assertContains('-----BEGIN PGP MESSAGE', arg);
        return true;
      }));
  mockControl.$replayAll();

  composeglass.decorate(document.documentElement);
  stubs.replace(composeglass.chipHolder_, 'getSelectedUids', function() {
    return [USER_ID_2];
  });

  var protectBtn = document.querySelector('button.insert');
  protectBtn.click();

  asyncTestCase.waitForAsync('Waiting for message to be encrypted.');
  window.setTimeout(function() {
    mockControl.$verifyAll();
    asyncTestCase.continueTesting();
  }, 100);
}


function testSendPlaintext() {
  var message = 'foo';
  stubs.replace(composeglass, 'insertMessageIntoPage_',
                mockControl.createFunctionMock('insertMessageIntoPage_'));
  composeglass.insertMessageIntoPage_(
      goog.testing.mockmatchers.ignoreArgument,
      new goog.testing.mockmatchers.ArgumentMatcher(function(arg) {
        assertEquals('foo', arg);
        return true;
      }));
  mockControl.$replayAll();
  composeglass.sendUnencrypted_ = true;
  stubs.replace(composeglass, 'handleMissingPublicKeys_', goog.nullFunction);

  composeglass.decorate(document.documentElement);
  stubs.replace(composeglass.chipHolder_, 'getSelectedUids', function() {
    return ['yan <yzhu@yahoo-inc.com>', 'test@c.com'];
  });
  var textarea = document.querySelector('textarea');
  textarea.value = message;

  var protectBtn = document.querySelector('button.insert');
  protectBtn.click();

  asyncTestCase.waitForAsync('Waiting for message to be inserted.');
  window.setTimeout(function() {
    mockControl.$verifyAll();
    asyncTestCase.continueTesting();
  }, 100);
}

function testDisplayFailure() {
  composeglass.decorate(document.documentElement);
  var errorDiv = document.getElementById(constants.ElementId.ERROR_DIV);

  composeglass.displayFailure_(new Error('test failure'));
  assertEquals('test failure', errorDiv.textContent);
}


function testClose() {
  composeglass.decorate(document.body);
  composeglass.close();

  assertTrue(composeglass.isDisposed());

  goog.array.forEach(
      document.querySelectorAll('textarea,input'), function(elem) {
        assertEquals('', elem.value);
      });
}


function populatePgpKeys(opt_key) {
  var ctx = launcher.getContext();
  ctx.importKey(function(uid, callback) {
    callback('test');
  }, PRIVATE_KEY_ASCII);

  ctx.importKey(function() {}, PUBLIC_KEY_ASCII);
  if (opt_key) {
    ctx.importKey(function() {}, opt_key);
  }
}
