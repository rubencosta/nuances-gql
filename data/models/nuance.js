import mongoose from 'mongoose'

const nuanceSchema = new mongoose.Schema({
  word: String,
  image: String,
  description: String,
  counters: {
    liked: {
      type: Number,
      default: 0,
    },
  },
  createdOn: Date,
  lastChange: Date
})

export default mongoose.model('Nuance', nuanceSchema)