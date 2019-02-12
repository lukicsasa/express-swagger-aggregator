const yaml = require('js-yaml')
const fs = require('fs')
const axios = require("axios")
const _ = require('lodash')
const swaggerUi = require('swagger-ui-express')

module.exports.swaggerUi = async (req, res, next) => {
    const config = await readConfigFile()
    return res.send(swaggerUi.generateHTML(await aggregate(), {customSiteTitle: config.name}))
}

module.exports.getDocs = async (req, res, next) => {
    return res.json(await aggregate())
}

async function aggregate () {
    const config = await readConfigFile()

    const swaggers = (await Promise.all(
        config.endpoints.map(endpoint => axios.get(endpoint))
    )).map(x => x.data)

    return mergeSwaggers(swaggers, config)
}

async function readConfigFile () {
    const file = await fs.readFileSync('./config.yaml', 'utf8')
    return yaml.safeLoad(file)
}

function mergeSwaggers (swaggers, config) {
    const info = swaggers[0].info
    info.title = "Aggregated Api Documentation"
    info.description = config.endpoints.reduce((x, y) => x + ", \n " + y)
    return {
        host: config.baseUrl,
        info: info,
        swagger: swaggers[0].swagger,
        definitions: mergeDefinitions(swaggers),
        tags: mergeTags(swaggers),
        paths: mergePaths(swaggers)
    }
}

function mergePaths (swaggers) {
    const paths = {}

    _.each(swaggers, swagger => {
        for (const path in swagger.paths) {
            paths[path] = swagger.paths[path]
        }
    })

    return paths
}

function mergeDefinitions (swaggers) {
    const definitions = {}

    _.each(swaggers, swagger => {
        for (const definition in swagger.definitions) {
            definitions[definition] = swagger.definitions[definition]
        }
    })

    return definitions
}

function mergeTags (swaggers) {
    const tags = []

    _.each(swaggers, swagger => {
        _.each(swagger.tags, tag => {
            tag.description = tag.description + ` (${swagger.host})`
            tags.push(tag)
        })
    })

    return tags
}



