import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
} from 'graphql'

import Nuance from '../models/nuance'

async function getNuances (){
  try {
    const nuances = await Nuance.find({})
    return nuances
  } catch (err) {
    console.error(err)
  }
}

const wordType = new GraphQLObjectType({
  name: "Word",
  fields: () => ({
    text: {
      type: GraphQLString,
    },
    alias: {
      type: GraphQLString,
    }
  })
})

const nuanceType = new GraphQLObjectType({
  name: 'Nuance',
  fields: () => ({
    _id: {
      type: GraphQLString,
    },
    word: {
      type: wordType,
    },
    image:{
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
  }),
})

const viewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: () => ({
    nuances: {
      type: new GraphQLList(nuanceType),
      resolve: () => getNuances()
    }
  })
})

var queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    viewer: {
      type: viewerType,
      resolve: () => ({})
    }
  })
});
const schema = new GraphQLSchema({
  query: queryType
})

export default schema