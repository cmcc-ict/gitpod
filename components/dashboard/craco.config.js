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
                     cookie: '_gitpod_io_=s%3Abd0febaf-1d99-490b-a4b9-ce452d06e107.aSzRjYOESeI1d582QOVKl%2BiViWNHWnGzYO08%2BKvTpo8'
                }
            }
        }
    }
}
