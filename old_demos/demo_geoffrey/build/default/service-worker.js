/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["bower_components/polymer/lib/elements/array-selector.html","a8b920f6342d0c0a93209e7f2c7ce2cd"],["bower_components/polymer/lib/elements/custom-style.html","8b8096f121770ec733086535e851d79a"],["bower_components/polymer/lib/elements/dom-bind.html","7846323d2f034392a81a6470d3a95504"],["bower_components/polymer/lib/elements/dom-if.html","2bc89ed73da881118b5dc815ae231c61"],["bower_components/polymer/lib/elements/dom-module.html","c1207c8ad129b1e96a6a8b29cbd0e6f5"],["bower_components/polymer/lib/elements/dom-repeat.html","0b716285b920ab6532824bf8df3fe34e"],["bower_components/polymer/lib/legacy/class.html","b3a28b781c4abefac6978fde54514322"],["bower_components/polymer/lib/legacy/legacy-element-mixin.html","b8874aa4a2ccd1715efd9ae45331a883"],["bower_components/polymer/lib/legacy/mutable-data-behavior.html","ca93373534d98979a78eb8aa6facc8df"],["bower_components/polymer/lib/legacy/polymer-fn.html","5d99aef273c86bd97b5b35b1252e660a"],["bower_components/polymer/lib/legacy/polymer.dom.html","cf1364c628326995021d26e289a39eb9"],["bower_components/polymer/lib/legacy/templatizer-behavior.html","8e107957eda9b14593cfef065fce57d0"],["bower_components/polymer/lib/mixins/dir-mixin.html","a62ed20b0fcc92a267d431cccb91f878"],["bower_components/polymer/lib/mixins/element-mixin.html","5f50528025dcfe640bc5589d96f8f9e2"],["bower_components/polymer/lib/mixins/gesture-event-listeners.html","c354a4fb2a63faebc074cff276533cb2"],["bower_components/polymer/lib/mixins/mutable-data.html","ffa78b3164fc1a2f8eec19cf303e9c3e"],["bower_components/polymer/lib/mixins/properties-changed.html","a9dc6f7ab16e0e63a096d24086e27676"],["bower_components/polymer/lib/mixins/properties-mixin.html","5058216313a0e485ecfe31fe2f79bad3"],["bower_components/polymer/lib/mixins/property-accessors.html","417488e4845e5e84b4b8cda4585317e8"],["bower_components/polymer/lib/mixins/property-effects.html","cf35273e6e0c1ac1337d1d40ca8bc045"],["bower_components/polymer/lib/mixins/template-stamp.html","1c982cc1e445b29ada06a1c240bed696"],["bower_components/polymer/lib/utils/array-splice.html","d2bb02b1c08121d1597fdf59f1e3fac9"],["bower_components/polymer/lib/utils/async.html","0095c1922ada58748dfbbee2e78b33ea"],["bower_components/polymer/lib/utils/boot.html","72440fcffd61e7e1397dbea2dcd03580"],["bower_components/polymer/lib/utils/case-map.html","09a10641f0af240bf5f4e7406899e3e6"],["bower_components/polymer/lib/utils/debounce.html","e6bda7bb7d338088cbce78e2c230b345"],["bower_components/polymer/lib/utils/flattened-nodes-observer.html","843b70d12912fe4753445f3dab997d5c"],["bower_components/polymer/lib/utils/flush.html","c2c1a523aae0b066aeb4fb7b6c247293"],["bower_components/polymer/lib/utils/gestures.html","18e990c357350c58ba2c511cbfd45b56"],["bower_components/polymer/lib/utils/html-tag.html","a71018e085a7a4e78550d694f3c2239e"],["bower_components/polymer/lib/utils/import-href.html","4a541763590e235c25da6d8bbf790de8"],["bower_components/polymer/lib/utils/mixin.html","d09c423f377db40fc2e0074fdd3ec17c"],["bower_components/polymer/lib/utils/path.html","e833e5f67bec5678897a885a7a0f3b45"],["bower_components/polymer/lib/utils/render-status.html","103c32d3aa48564db34d93594a19f6ff"],["bower_components/polymer/lib/utils/resolve-url.html","d5d32c9b4c30c7ad8bc655cf424aa3c0"],["bower_components/polymer/lib/utils/settings.html","3f519cf0a476d08587931226de916c34"],["bower_components/polymer/lib/utils/style-gather.html","cb0bfeb54a79296bed80e7c50ef19be9"],["bower_components/polymer/lib/utils/templatize.html","feb22f2c22e4a0699f9f981348cfe594"],["bower_components/polymer/lib/utils/unresolved.html","2ed3277470301933b1af10d413d8c614"],["bower_components/polymer/polymer-element.html","3c2495e07d3d226b07d336e3bbcf2879"],["bower_components/polymer/polymer.html","04fe0f988c84c96ecf449ca2381d122d"],["bower_components/shadycss/apply-shim.html","5b73ef5bfcac4955f6c24f55ea322eb1"],["bower_components/shadycss/apply-shim.min.js","996204e3caf0fd21a4d0b39bd4cbab17"],["bower_components/shadycss/custom-style-interface.html","7e28230b85cdcc2488e87172c3395d52"],["bower_components/shadycss/custom-style-interface.min.js","6e2cb1745040846fe648378e542eeb62"],["index.html","50c03d22f60b0d63261b9cf82a978c35"],["manifest.json","14e30ed1b5da88b5c20c4deee45e5eb1"],["src/canvas-button.html","9e31b8bfb610cf4d653ec437d0041aae"],["src/formes-standard.js","8579b2581ad1961f88de5a3d9dd09258"],["src/formules.js","2005d8e268a6f70198ce6f75e74f1682"],["src/main-canvas.html","f5e10412274be9fb46c439505567d310"],["src/my-app.html","62d66b209ac79b521bc431b604b02954"],["src/operation-construct-shape.html","ec6e0447ce425e4af2d4a5f272938cf7"],["src/operation-glisser.html","9c937c4c5322b7ff45361dd69a37972a"],["src/operation-tourner.html","821a1795e9bf2a3df8977cbca0ae3209"],["src/shapes-list.html","7a099a117dc387d05f4c5a24cd056595"]];
var cacheName = 'sw-precache-v3--' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function (originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function (originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function (originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = '';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '/index.html';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted(["\\/[^\\/\\.]*(\\?|$)"], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







