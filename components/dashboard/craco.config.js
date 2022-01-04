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
                     cookie: '_gitpod_io_=s%3A0dbbeddd-b4eb-4cb9-afb1-b8ee089957c2.MDDxxLH2cky2lt%2FsOlcw2Fjdb%2BcP0P3stYOSRcEF%2FiY'
                }
            }
        }
    }
}
