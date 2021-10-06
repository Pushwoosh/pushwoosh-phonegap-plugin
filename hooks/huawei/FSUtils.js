/*
    Copyright 2020-2021. Huawei Technologies Co., Ltd. All rights reserved.

    Licensed under the Apache License, Version 2.0 (the "License")
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

"use strict";

var fs = require("fs");

var FSUtils = (function () {
    var api = {};

    api.exists = function (path) {
        try {
            return fs.existsSync(path);
        } catch (err) {
            /*NOPE*/
        }
        return false;
    };

    api.copyFile = function (src, dest) {
        fs.copyFileSync(src, dest);
    };

    api.readFile = function (path, encoding) {
        return fs.readFileSync(path, encoding);
    };

    api.writeFile = function (path, content) {
        fs.writeFileSync(path, content);
    };

    return api;
})();

module.exports = FSUtils;
