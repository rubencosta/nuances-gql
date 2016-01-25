import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema({
  text: {
    type: String,
    isRequired: true,
    index: true,
    unique: true,
  },
  alias: {
    type: String,
    isRequired: true,
  },
  counters: {
    defined: {
      type: Number,
      default: 0,
    },
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
})

export const Word = mongoose.model('Word', wordSchema)

export async function getWords() {
  try {
    return await Word.find({})
  } catch (err) {
    throw err
  }
}

export async function getWordById(wordId) {
  try {
    return await Word.findOne({_id: wordId})
  } catch (err) {
    throw (err)
  }
}

export async function introduceWord(data) {
  try {
    const word = new Word(data)
    await word.save()
    return word
  } catch (err) {
    throw (err)
  }
}

