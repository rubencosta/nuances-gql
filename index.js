import express from 'express'

const app = express()

app.get('/', (req, res) => res.send('hello nodemon!'))

app.listen(8000)