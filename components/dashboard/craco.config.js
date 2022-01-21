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
                     cookie: '_gitpod_io_=s%3A68eeb162-f1ee-4143-964f-886e0c25e893.AvShGgRR4q4IKQfh1aN80mH%2BhnQbQos89YXH7AZ5cQA'
                }
            }
        }
    }
}
