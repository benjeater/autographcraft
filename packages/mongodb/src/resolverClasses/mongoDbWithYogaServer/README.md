# Yoga Server

<https://the-guild.dev/graphql/codegen/docs/guides/graphql-server-apollo-yoga-with-server-preset#:~:text=(3000)-,Implementing%20Resolvers,-Operation%20resolvers%20are>

There is no difference in how resolvers are called in Apollo Server and Yoga Server. The parameters are:

- parent: The return value of the resolver for this field's parent (the resolver for the field one level up in the query)
- args: An object that contains all GraphQL arguments provided for this field
- context: An object shared by all resolvers in a particular query, and also between resolvers and their data sources
- info: Information about the execution state of the query, including the field name, path to the field from the root, and more

We can therefore reuse the resolvers we wrote for Apollo Server in Yoga Server.

This directory and README is here in case there is a need to add any Yoga Server specific resolvers or middleware.
