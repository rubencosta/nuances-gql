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
import path from 'path'
import uuid from 'uuid'
import nats from 'nats'
import protobuf from 'protobufjs'

const secret = 'secret'

const {ImgUrl} = protobuf.loadProtoFile('proto/img_resize.proto').build('imgresizer')
const natsClient = nats.connect()

const app = express()
const multerStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, 'upload'))
  },
  filename(req, file, cb) {
    cb(null, `${uuid()}.${file.originalname.split('.').reverse().shift()}`)
  }
})
const upload = multer({storage: multerStorage})

mongoose.set('debug', true)
mongoose.connect('mongodb://localhost/nuances')
const {connection: db} = mongoose
db.on('error', (err) => console.error(err))
db.once('open', () => {
  app.listen(8000)
})
app.options('*', cors())
app.use(cors())
app.use(express.static(path.join(__dirname, '/upload')))
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
    natsClient.publish('image.resize', new ImgUrl({url: req.file.path}).encode().buffer)
    req.file = req.file.filename
    next()
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
