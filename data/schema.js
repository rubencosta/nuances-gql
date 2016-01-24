import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString
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
    const nuances = await Nuance.find({})
    return nuances
  } catch (err) {
    console.error(err)
  }
}

async function getNuanceById(id) {
  try {
    const nuance = await Nuance.findOne({_id: id})
    return nuance
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

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    node: nodeField,
    createNuance: createNuanceMutation,
  })
})

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
})

export default schema