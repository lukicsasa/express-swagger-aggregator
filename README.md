# Swagger Aggregator

Node.js Express tool that aggregates Swagger documentation from different endpoints at one place.

### Installation

``npm install swagger-aggregator``
 
## Overview

As seen in example, it is supposed to be used as standalone application with sole purpose to aggreagate different api-docs endpoints. Example shows usage of it with `serverless` framework, which quickly deploys app on AWS lambda.

## Usage

Register `swagger-aggregator` as middleware in your project:
```
const app = express()

app.use(swaggerAggregator('./config.yaml'))
```
Where `'./config.yaml'` represents configuration file


Configuration file structure:

```
name: 
baseUrl: 
endpoints:
  - url: 
    name: 
  - url: 
    name: 
```


