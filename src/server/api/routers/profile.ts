import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      const currentUserId = ctx.session?.user.id

      const profile = await ctx.db.user.findUnique({
        where: { id },
        select: {
          name: true,
          image: true,
          _count: {
            select: {
              friends: true,
              friendsOf: true,
              posts: true
            }
          },
          friends: currentUserId == null
            ? undefined
            : { where: { id: currentUserId } }
        }
      })

      if (profile == null) return

      return {
        name: profile.name,
        image: profile.image,
        friendsCount: profile._count.friends,
        postsCount: profile._count.posts,
        areFriends: profile.friends.length > 0
      }
    }),
  toggleFriend: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(
      async ({ input: { userId }, ctx }) => {
        const currentUserId = ctx.session.user.id

        const existingFriend = await ctx.db.user.findFirst({
          where: { id: userId, friends: { some: { id: currentUserId } } }
        })

        let addedFriend

        if (existingFriend == null) {
          await ctx.db.user.update({
            where: { id: userId },
            data: { friends: { connect: { id: currentUserId } } }
          })
          addedFriend = true
        } else {
          await ctx.db.user.update({
            where: { id: userId },
            data: { friends: { disconnect: { id: currentUserId } } }
          })
          addedFriend = false
        }

        // Revalidation
        void ctx.revalidateSSG?.(`/profiles/${userId}`)
        void ctx.revalidateSSG?.(`/profiles/${currentUserId}`)


        return { addedFriend }
      }
    )
})
