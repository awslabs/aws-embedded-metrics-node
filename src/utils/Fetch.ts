/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates.
 * Licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';

const SOCKET_TIMEOUT = 1000;

/**
 * Fetch JSON data from an remote HTTP endpoint and de-serialize to the provided type.
 * There are no guarantees the response will conform to the contract defined by T.
 * It is up to the consumer to ensure the provided T captures all possible response types
 * from the provided endpoint.
 *
 * @param url - currently only supports HTTP
 */
const fetch = <T>(url: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const request = http
      .get(url, { timeout: 2000 }, (response: http.IncomingMessage) => {
        if (!response.statusCode) {
          reject(`Received undefined response status code from '${url}'`);
          return;
        }

        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Failed to load page, status code: ' + response.statusCode));
          return;
        }

        // using similar approach to node-fetch
        // https://github.com/bitinn/node-fetch/blob/6a5d192034a0f438551dffb6d2d8df2c00921d16/src/body.js#L217
        const body: Uint8Array[] = [];
        let bodyBytes = 0;
        response.on('data', (chunk: Uint8Array) => {
          bodyBytes += chunk.length;
          body.push(chunk);
        });

        response.on('end', () => {
          let responseString;
          try {
            const buffer: Buffer = Buffer.concat(body, bodyBytes);
            responseString = buffer.toString();
            const parsedJson = JSON.parse(responseString);
            resolve(parsedJson as T);
          } catch (e) {
            reject(`Failed to parse response from '${url}' as JSON. Received: ${responseString}`);
          }
        });
      })
      .on('error', (err: unknown) => {
        reject(err);
      });

    request.on('socket', socket => {
      socket.on('timeout', () => {
        request.abort();
        reject(`Socket timeout while connecting to '${url}'`);
      });
      socket.setTimeout(SOCKET_TIMEOUT);
    });
  });
};

export { fetch };
