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
import path from 'path'
import grpc from 'grpc'

const secret = 'secret'

const {imgresizer: {ImgResizer}} = grpc.load(path.join(__dirname, 'proto/img_resize.proto'))
const imgresizerClient = new ImgResizer('localhost:8888', grpc.credentials.createInsecure())
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
  (req, res, next) => {
    if (!req.file) {
      return next()
    }
    console.log('making grpc req')
    console.log(req.file.filename)
    return imgresizerClient.processImg(req.file.filename, (err, {url}) => {
      if (err) {
        return next(err)
      }
      req.file = url
      return next()
    })
  },
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
