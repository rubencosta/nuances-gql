import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema({
  text: String,
  alias: String,
  counters: {
    defined: Number
  },
  createdOn: Date,
})

const nuanceSchema = new mongoose.Schema({
  word: wordSchema,
  image: String,
  description: String,
  counters: {
    like: {
      type: Number,
      default: 0,
    },
  },
  createdOn: Date,
  lastChange: Date
})

export default mongoose.model('Nuance', nuanceSchema)