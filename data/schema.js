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

import Nuance from './models/nuance'

async function getNuances() {
  try {
    return await Nuance.find({})
  } catch (err) {
    console.error(err)
  }
}

async function getNuanceById(id) {
  try {
    return await Nuance.findOne({_id: id})
  } catch (err) {
    console.error(err)
  }
}

async function createNuance(data) {
  try {
    const nuance = new Nuance(data)
    await nuance.save()
    return nuance
  } catch (err) {
    console.log(err)
  }
}

async function likeNuance(nuanceId) {
  try {
    return await Nuance.findByIdAndUpdate(nuanceId, {$inc: {'counters.liked': 1}}).exec()
  } catch (err) {
    console.log(err)
  }
}

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalID) => {
    const {type, id} = fromGlobalId(globalID)
    if (type === 'Nuance') {
      return getNuanceById(id)
    }
    return null
  },
  (obj) => {
    if (obj instanceof Nuance) {
      return nuanceType
    }
    return null
  }
)

const nuanceType = new GraphQLObjectType({
  name: 'Nuance',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (obj) => obj._id,
    },
    word: {
      type: GraphQLString,
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
        fields:() => ({
          liked: {
            type: GraphQLInt
          }
        }),
      })
    }
  }),
  interfaces: [nodeInterface],
})

const {connectionType: nuanceConnection} = connectionDefinitions({nodeType: nuanceType})

const viewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: () => ({
    nuanceConnection: {
      type: nuanceConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getNuances(), args)
    }
  })
})

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    viewer: {
      type: viewerType,
      resolve: () => ({})
    }
  })
})

const createNuanceMutation = mutationWithClientMutationId({
  name: 'CreateNuance',
  inputFields: {
    word: {
      type: new GraphQLNonNull(GraphQLString)
    },
    description: {
      type: new GraphQLNonNull(GraphQLString)
    },
  },
  outputFields: {
    nuance: {
      type: nuanceType,
      resolve: (nuance) => nuance
    },
  },
  mutateAndGetPayload: (data) => createNuance(data)
})

const likeNuanceMutation = mutationWithClientMutationId({
  name: "LikeNuance",
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
    node: nodeField,
    createNuance: createNuanceMutation,
    likeNuance: likeNuanceMutation,
  })
})

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
})

export default schema