/* eslint-disable */
// @ts-nocheck
// prettier-ignore
// This file has been generated by AutoGraph. Do not edit this file directly.
// Any changes made to this file will be overwritten when AutoGraphCraft is next run.

import { readUser } from '../models/modelUser';
import { listUser } from '../models/modelUser';
import { readUserSubscription } from '../models/modelUserSubscription';
import { listUserSubscription } from '../models/modelUserSubscription';
import { createUser } from '../models/modelUser';
import { updateUser } from '../models/modelUser';
import { deleteUser } from '../models/modelUser';
import { createUserSubscription } from '../models/modelUserSubscription';
import { updateUserSubscription } from '../models/modelUserSubscription';
import { deleteUserSubscription } from '../models/modelUserSubscription';

export const resolvers = {
  Query: {
    readUser,
    listUser,
    readUserSubscription,
    listUserSubscription,
  },
  Mutation: {
    createUser,
    updateUser,
    deleteUser,
    createUserSubscription,
    updateUserSubscription,
    deleteUserSubscription,
  },
  User: {
    subscriptions: async (parent, args, context, info) => {
      const mergedFilter = { ...args.filter, userId: { eq: parent.id } };
      const mergedArgs = { ...args, filter: mergedFilter };
      return listUserSubscription(parent, mergedArgs, context, info); 
    },
  },
  UserSubscription: {
    user: async (parent, args, context, info) => { 
      const relationalArgs = { ...args, id: parent.userId };
      return readUser(parent, relationalArgs, context, info); 
    },
  },
};

export default resolvers;
