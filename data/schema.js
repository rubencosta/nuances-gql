import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLInt
} from 'graphql'

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  mutationWithClientMutationId,
  fromGlobalId,
  nodeDefinitions
} from 'graphql-relay'

import { Nuance, createNuance, getNuanceById, getNuances, getNuancesByUserId, likeNuance } from './models/nuance'
import { Word, introduceWord, getWordById, getWords } from './models/word'
import { User, createUser, getUserById, getUserByUsername } from './models/user'

var mongoIdType = {
  type: new GraphQLNonNull(GraphQLID),
  resolve: (obj) => obj._id,
}

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalID) => {
    const {type, id} = fromGlobalId(globalID)
    if (type === 'Nuance') {
      return getNuanceById(id)
    } else if (type === 'Word') {
      return getWordById(id)
    } else if (type === 'User') {
      return getUserById(id)
    }
    return null
  },
  (obj) => {
    if (obj instanceof Nuance) {
      return nuanceType
    } else if (obj instanceof Word) {
      return wordType
    } else if (obj instanceof User) {
      return userType
    }
    return null
  }
)

const wordType = new GraphQLObjectType({
  name: 'Word',
  fields: () => ({
    id: mongoIdType,
    text: {
      type: GraphQLString,
    },
    alias: {
      type: GraphQLString,
    }
  }),
  interfaces: [nodeInterface],
})

const {connectionType: wordConnection} = connectionDefinitions({nodeType: wordType})

const allWordsType = new GraphQLObjectType({
  name: 'AllWords',
  fields: () => ({
    wordConnection: {
      type: wordConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getWords(), args)
    },
  }),
})

const nuanceType = new GraphQLObjectType({
  name: 'Nuance',
  fields: () => ({
    id: mongoIdType,
    creator: {
      type: userType,
      resolve: (obj) => getUserById(obj.creator)
    },
    word: {
      type: wordType,
      resolve: (obj) => getWordById(obj.word)
    },
    image: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    counters: {
      type: new GraphQLObjectType({
        name: 'NuanceCounters',
        fields: () => ({
          liked: {
            type: GraphQLInt
          },
        }),
      }),
    },
  }),
  interfaces: [nodeInterface],
})

const {connectionType: nuanceConnection} = connectionDefinitions({nodeType: nuanceType})

const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: mongoIdType,
    auth: {
      type: new GraphQLObjectType({
        name: 'UserAuth',
        fields: ()=>({
          local: {
            type: new GraphQLObjectType({
              name: 'UserAuthLocal',
              fields: () => ({
                username: {
                  type: GraphQLString,
                },
                email: {
                  type: GraphQLString,
                },
              }),
            }),
          },
        }),
      })
    },
    nuanceConnection: {
      type: nuanceConnection,
      args: connectionArgs,
      resolve: (obj, args) => connectionFromPromisedArray(getNuancesByUserId(obj.id), args)
    }
  }),
  interfaces: [nodeInterface],
})

const allNuancesType = new GraphQLObjectType({
  name: 'AllNuances',
  fields: () => ({
    nuanceConnection: {
      type: nuanceConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getNuances(), args)
    }
  }),
})

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    user: {
      type: userType,
      args: {
        username: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (_, {username}) => getUserByUsername(username)
    },
    allNuances: {
      type: allNuancesType,
      resolve: () => ({})
    },
    allWords: {
      type: allWordsType,
      resolve: () => ({})
    }
  })
})

const createNuanceMutation = mutationWithClientMutationId({
  name: 'CreateNuance',
  inputFields: {
    user: {
      type: new GraphQLNonNull(GraphQLID),
    },
    word: {
      type: new GraphQLNonNull(GraphQLID),
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    nuance: {
      type: nuanceType,
      resolve: (nuance) => nuance
    },
    user: {
      type: userType,
      resolve: (nuance) => getUserById(nuance.creator)
    }
  },
  mutateAndGetPayload: (data) => createNuance({
    ...data,
    user: fromGlobalId(data.user).id,
    word: fromGlobalId(data.word).id,
  })
})

const introduceWordMutation = mutationWithClientMutationId({
  name: 'IntroduceWord',
  inputFields: {
    text: {
      type: new GraphQLNonNull(GraphQLString)
    },
    alias: {
      type: new GraphQLNonNull(GraphQLString)
    },
  },
  outputFields: {
    word: {
      type: wordType,
      resolve: (word) => word
    },
  },
  mutateAndGetPayload: (data) => introduceWord(data)
})

const createUserMutation = mutationWithClientMutationId({
  name: 'CreateUser',
  inputFields: {
    username: {
      type: new GraphQLNonNull(GraphQLString)
    },
    email: {
      type: new GraphQLNonNull(GraphQLString)
    },
    password: {
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: (user) => user,
    }
  },
  mutateAndGetPayload: (data) => createUser(data)
})

const likeNuanceMutation = mutationWithClientMutationId({
  name: 'LikeNuance',
  inputFields: {
    nuanceId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    nuance: {
      type: nuanceType,
      resolve: (nuance) => nuance
    }
  },
  mutateAndGetPayload: ({nuanceId}) => likeNuance(nuanceId)

})

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createUser: createUserMutation,
    createNuance: createNuanceMutation,
    likeNuance: likeNuanceMutation,
    introduceWord: introduceWordMutation,
  })
})

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
})

export default schema