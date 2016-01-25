import mongoose from 'mongoose'

const nuanceSchema = new mongoose.Schema({
  word: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    isRequired: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    isRequired: true,
  },
  image: String,
  description: String,
  counters: {
    liked: {
      type: Number,
      default: 0,
    },
  },
  createdOn: {
    type: Date,
    default: Date.now()
  },
  lastChange: Date
})

export const Nuance = mongoose.model('Nuance', nuanceSchema)

export async function getNuances() {
  try {
    return await Nuance.find({})
  } catch (err) {
    throw err
  }
}

export async function getNuancesByUserId(userId) {
  try {
    return await Nuance.find({creator: userId})
  } catch (err) {
    throw err
  }
}

export async function getNuanceById(id) {
  try {
    return await Nuance.findOne({_id: id})
  } catch (err) {
    throw err
  }
}

export async function createNuance(data) {
  try {
    const nuance = new Nuance(data)
    await nuance.save()
    return nuance
  } catch (err) {
    throw err
  }
}

export async function likeNuance(nuanceId) {
  try {
    return await Nuance.findByIdAndUpdate(nuanceId, {$inc: {'counters.liked': 1}}).exec()
  } catch (err) {
    throw err
  }
}
