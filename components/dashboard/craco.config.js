/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

module.exports = {
    style: {
        postcss: {
            plugins: [
                require('tailwindcss'),
                require('autoprefixer'),
            ],
        }
    },
    devServer: {
        proxy: {
            '/api': {
                 target: 'https://' + 'gitpod.io',
                 ws: true,
                 headers: {
                     host: 'gitpod.io',
                     origin: 'https://' + 'gitpod.io',
                     cookie: '_gitpod_io_=s%3A0a317dbd-5e7c-4244-9f89-b7d08ee11b29.wcg0If6PEBe%2F7OLlbATXjULNKKMDDRS01pqUiQRIPP0'
                }
            }
        }
    }
}
