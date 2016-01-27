import express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import cors from 'cors'
import mongoose from 'mongoose'
import GraphQLHTTP from 'express-graphql'
import schema from './data/schema'
import { getUserByUsername } from './data/models/user'
import multer from 'multer'
import os from 'os'

const secret = 'secret'

const app = express()
const upload = multer({dest: os.tmpdir()})

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

app.use(
  '/graphql',
  expressJwt({
    secret,
    credentialsRequired: false,
  }),
  upload.single('image'),
  GraphQLHTTP((req) => ({
    schema,
    graphiql: true,
    rootValue: {req}
  }))
)

app.post('/authenticate', bodyParser.json(), (req, res) => {
  getUserByUsername(req.body.username)
    .then((user) => {
      if (user.isValidPassword(req.body.password)) {
        return user
      }
      throw new Error('invalid password')
    })
    .then((user) => {
      const token = jwt.sign(user.toObject(), secret, {expiresIn: 5 * 60 * 60})
      res.json({token})
    })
    .catch((err) => {
      console.error(err)
      res.send(401, 'wrong username or password')
    })
})
