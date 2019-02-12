const bodyParser = require('body-parser')
const express = require('express')
const sls = require('serverless-http')
const swaggerUi = require('swagger-ui-express')
const router = require('express').Router()

const swaggerAggregator = require('./swagger-aggregator')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.use((err, req, res, next) => {
    if (err) {
        res.status(err.status || 500).json({err: err.message})
    } else {
        next()
    }
})

router.use('/', swaggerUi.serve);
router.get('/api-docs', swaggerAggregator.getDocs)
router.get('/', swaggerAggregator.swaggerUi)

app.use(router)

module.exports.server = sls(app)

