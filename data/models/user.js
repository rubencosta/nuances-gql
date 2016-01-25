import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  auth: {
    local: {
      username: {
        type: String,
        isRequired: true,
        index: true,
        unique: true,
      },
      alias: {
        type: String,
        isRequired: true,
      },
      email: {
        type: String,
        isRequired: true,
        unique: true,
      },
      password: {
        type: String,
        isRequired: true
      }
    }
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
})

const generateHash = (password) => bcrypt.hashSync(password, 10)

userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compareSync(password, this.auth.local.password)
}

export const User = mongoose.model('User', userSchema)

export async function createUser({username, email, password}) {
  //TODO: validate email
  try {
    const user = new User({
      auth: {
        local: {
          username: username.toLowerCase(),
          alias: username,
          email,
          password: generateHash(password)
        }
      },
    })
    await user.save()
    return user
  } catch (err) {
    throw err
  }
}

export async function getUserById(id) {
  try {
    return await User.findOne({_id: id})
  } catch (err) {
    throw err
  }
}

export async function getUserByUsername(username) {
  try {
    return await User.findOne({'auth.local.username': username.toLowerCase()})
  } catch (err) {
    throw err
  }
}