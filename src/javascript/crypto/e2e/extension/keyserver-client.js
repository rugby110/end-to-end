/**
 * @license
 * Copyright 2014 Yahoo Inc. All rights reserved.
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
 * @fileoverview The Yahoo E2E keyserver client component.
 */

goog.provide('e2e.ext.KeyserverClient');
goog.provide('e2e.ext.KeyserverResponseError');
goog.provide('e2e.ext.KeyserverAuthError');

goog.require('e2e.ext.constants');
goog.require('e2e.ext.utils');
goog.require('e2e.ext.messages.KeyserverKeyData');
goog.require('e2e.ext.messages.KeyserverSignedResponse');
goog.require('e2e.openpgp.error.Error');
goog.require('goog.math');
goog.require('goog.array');


goog.scope(function() {
var ext = e2e.ext;
var messages = e2e.ext.messages;



/**
 * Error indicating an invalid response from the keyserver.
 * @param {*=} opt_msg The custom error message.
 * @constructor
 * @extends {e2e.openpgp.error.Error}
 */
e2e.KeyserverResponseError = function(opt_msg) {
  goog.base(this, opt_msg);
};
goog.inherits(e2e.KeyserverResponseError, e2e.openpgp.error.Error);



/**
 * Error indicating invalid authorization for a request.
 * @param {*=} opt_msg The custom error message.
 * @constructor
 * @extends {e2e.openpgp.error.Error}
 */
e2e.KeyserverAuthError = function(opt_msg) {
  goog.base(this, opt_msg);
};
goog.inherits(e2e.KeyserverAuthError, e2e.openpgp.error.Error);



/**
 * Constructor for the keyclient.
 * @type {e2e.openpgp.Context} context OpenPGP context
 * @constructor
 */
ext.KeyserverClient = function(context) {
  /**
   * The PGP context used by the extension.
   * @type {e2e.openpgp.Context}
   * @private
   */
  this.pgpContext_ = context;

  this.keyserverOrigin_ = 'http://localhost.com:34555';
  this.keyserverApiVersion_ = 'v1';
  this.maxFreshnessTime = 24 * 3600 * 1000;
};


/**
 * Friendlier wrapper around XHR.
 * @param {string} method The method, ex: 'GET'.
 * @param {string} path The URL path, ex: 'foo/bar'.
 * @param {function(*)} callback The success callback.
 * @param {function(number)} errback The errorback for non-200 codes.
 * @param {string=} opt_params Optional POST params.
 * @private
 */
ext.KeyserverClient.prototype.sendRequest_ = function(method, path, callback,
                                                      errback, opt_params) {
  var xhr = new XMLHttpRequest();
  xhr.timeout = 1000;
  var url = [this.keyserverOrigin_, this.keyserverApiVersion_, path].join('/');
  xhr.open(method, url, true);
  if (method === 'POST' && opt_params) {
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send(opt_params);
  } else {
    xhr.send();
  }
  xhr.onreadystatechange = function() {
    var response;
    if (xhr.readystate === 4) {
      if (xhr.status === 200) {
        response = xhr.responseType === 'json' ? xhr.response :
            window.JSON.parse(xhr.responseText);
        callback(response);
      } else if (method === 'GET' && xhr.status === 404) {
        // We looked up keys for a user who has none.
        callback(null);
      } else{
        errback(xhr.status);
      }
    }
  };
};


/**
 * Executed when a keyserver request returns non-200/404 status.
 * @param {number} status The return code
 * @private
 */
ext.KeyserverClient.prototype.handleAuthFailure_ = function(status) {
  // redirect == YBY cookie not fresh, 401 == wrong YBY userid. treat them
  // the same for now.
  throw new ext.KeyserverAuthError('PLease login again');
};


/**
 * Fetches a key by userid from the keyserver.
 * @param {string} userid userid to look up. ex: yan@yahoo.com
 * @param {function(*)} callback
 * @private
 */
ext.KeyserverClient.prototype.fetchKey_ = function(userid, callback) {
  this.sendRequest_('GET', userid, callback, this.handleAuthFailure_);
};


/**
 * Submits a key to a keyserver.
 * @param {string} userid the userid of the key
 * @param {string} key Serialized OpenPGP key to send.
 */
ext.KeyserverClient.prototype.sendKey = function(userid, key) {
  // Check which device IDs already exist for this user
  this.fetchKey_(userid, goog.bind(function(response) {
    var registeredDeviceIds = [];
    var deviceId;
    var path;
    if (response === null) {
      return;
    } else if (response && response.keys) {
      // No point in validating the response, since attacker can at most
      // prevent user from registering certain device IDs.
      registeredDeviceIds = goog.object.getKeys(response.keys);
      do {
        deviceId = goog.math.randomInt(100000);
      } while (goog.array.contains(registeredDeviceIds, deviceId));
      path = [userid, deviceId].join('/');
      this.sendRequest_('POST', path, this.afterSendKey_,
                        this.handleAuthFailure_, key);
    }
  }, this));
};


/**
 * Fetches a key and imports it into the keyring.
 * @param {string} userid the userid of the key
 */
ext.KeyserverClient.prototype.fetchAndImportKeys = function(userid) {
  // Set freshness time to 24 hrs for now.
  var importCb = function(response) {
    var success = false;
    if (response && response.data && response.kauth_sig) {
      var resp = /** @type {messages.KeyserverSignedResponse} */ (response);
      if (this.verifyResponse_(resp)) {
        // Response is valid and correctly signed
        var keyData = /** @type {messages.KeyserverKeyData} */
            (window.JSON.parse(response.data));
        // Check that the response is fresh
        if (keyData.userid === userid &&
            new Date().getTime() - keyData.timestamp < this.maxFreshnessTime) {
          try {
            // Import keys into the keyring
            this.importKeys_(keyData);
            // Save the server response for keyring pruning
            this.cacheKeyData_(keyData);
          } catch(e) {}
        }
      }
    }
    if (!success) {
      throw new this.KeyserverResponseError();
    }
  };
  this.fetchKey_(userid, goog.bind(importCb, this));
};


/**
 * Extract keys from keydata and import them into the keyring.
 * @param {messages.KeyserverKeyData} keyData Key data to use for importing.
 * @private
 */
ext.KeyserverClient.prototype.importKeys_ = function(keyData) {
};


/**
 * Saves keydata entry to local storage.
 * @param {messages.KeyserverKeyData} keyData Key data to use for importing.
 * @private
 */
ext.KeyserverClient.prototype.cacheKeyData_ = function(keyData) {};


/**
 * Validates a response from the keyserver is correctly signed.
 * @param {messages.KeyserverSignedResponse} response Response from keyserver.
 * @private
 */
ext.KeyserverClient.prototype.verifyResponse_ = function(response) {};

}); // goog.scope



