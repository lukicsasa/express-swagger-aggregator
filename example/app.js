const express = require('express')
const sls = require('serverless-http')

const swaggerAggregator = require('../swagger-aggregator')

const app = express()

app.use((err, req, res, next) => {
    if (err) {
        res.status(err.status || 500).json({err: err.message})
    } else {
        next()
    }
})

app.use(swaggerAggregator('./config.yaml',  '/swagger-ui'))

module.exports.server = sls(app)

