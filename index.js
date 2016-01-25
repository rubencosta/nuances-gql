import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import GraphQLHTTP from 'express-graphql'
import schema from './data/schema'

const app = express()

mongoose.set('debug', true)
mongoose.connect('mongodb://localhost/nuances')
const {connection: db} = mongoose
db.on('error', (err) => console.error(err))
db.once('open', () => {
  console.log('db opened')
  app.listen(8000)
})

app.options('*', cors())
app.use(cors())
app.use('/graphql', GraphQLHTTP({schema, graphiql: true}))
