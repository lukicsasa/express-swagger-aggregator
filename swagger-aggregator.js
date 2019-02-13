const yaml = require('js-yaml')
const fs = require('fs')
const axios = require("axios")
const swaggerUi = require('swagger-ui-express')
const router = require('express').Router()

module.exports = (configFile, swaggerUiUrl, apiDocsUrl, swaggerOptions) => {
    router.use('/', swaggerUi.serve)
    router.get(apiDocsUrl || '/api-docs', getApiDocs(configFile))
    router.get(swaggerUiUrl || '/', getSwaggerUi(configFile, swaggerOptions))

    return router
}

function getSwaggerUi (configFile, swaggerOptions) {
    return async (req, res) => {
        const config = await readConfigFile(configFile)

        return res.send(swaggerUi.generateHTML(await aggregate(config), {
            customSiteTitle: config.name,
            swaggerOptions:  swaggerOptions || {docExpansion: "none"}
        }))
    }
}

function getApiDocs (configFile) {
    return async (req, res) => {
        const config = await readConfigFile(configFile)
        return res.json(await aggregate(config))
    }
}

async function aggregate (config) {
    const swaggers = (await Promise.all(
        config.endpoints.map(endpoint => axios.get(endpoint.url))
    )).map(x => x.data)

    return mergeSwaggers(swaggers, config)
}

async function readConfigFile (path) {
    const file = await fs.readFileSync(path, 'utf8')
    const config = yaml.safeLoad(file)

    validateConfig(config)

    return config
}

function mergeSwaggers (swaggers, config) {
    const info = swaggers[0].info
    info.title = "Aggregated Api Documentation"
    info.description = config.endpoints.map(x => x.name + ' - ' + x.url).reduce((x, y) => x + "\n" + y)
    return {
        host: config.baseUrl,
        info: info,
        swagger: swaggers[0].swagger,
        definitions: mergeDefinitions(swaggers),
        tags: mergeTags(swaggers, config.endpoints),
        paths: mergePaths(swaggers)
    }
}

function mergePaths (swaggers) {
    const paths = {}

    swaggers.forEach(swagger => {
        for (const path in swagger.paths) {
            if (swagger.paths.hasOwnProperty(path)) {
                paths[path] = swagger.paths[path]
            }
        }
    })

    return paths
}

function mergeDefinitions (swaggers) {
    const definitions = {}

    swaggers.forEach(swagger => {
        for (const definition in swagger.definitions) {
            if (swagger.definitions.hasOwnProperty(definition)) {
                definitions[definition] = swagger.definitions[definition]
            }
        }
    })

    return definitions
}

function mergeTags (swaggers, endpoints) {
    const tags = []

    swaggers.forEach(swagger => {
        swagger.tags.forEach(tag => {
            tag.description = tag.description + ` (${endpoints.find(x => x.url.includes(swagger.host)).name})`
            tags.push(tag)
        })
    })

    return tags
}

function validateConfig (config) {
    if (!config.endpoints || !config.endpoints.length) {
        throw new Error('Endpoints not defined')
    }

    if (!config.name) {
        throw new Error('Name not defined')
    }

    if (!config.baseUrl) {
        throw new Error('Base Url not defined')
    }

}



