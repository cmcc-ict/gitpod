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
                     cookie: '_gitpod_io_=s%3A4fe95910-ad4d-4c7c-b8cf-2e3f89cc8ada.%2FSVbLrKaB%2FhBksZvt%2BhGIBjF8mTfNX9%2FWjHW7z9gKII'
                }
            }
        }
    }
}
