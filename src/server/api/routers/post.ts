import type { Prisma } from "@prisma/client";
import type { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import type { createTRPCContext } from "~/server/api/trpc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional(),
        cursor: z.object({ createdAt: z.date(), id: z.string() }).optional()
      })
    ).query(async ({
      input: { limit = 10, userId, cursor },
      ctx }) => {
      return await GetAllPosts({
        limit, ctx, cursor,
        whereClause: { userId }
      })
    }),
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFriends: z.boolean().optional(),
        limit: z.number().optional(),
        cursor: z.object({ createdAt: z.date(), id: z.string() }).optional()
      })
    ).query(async ({
      input: { limit = 10, onlyFriends = false, cursor },
      ctx, }) => {
      const currentUserId = ctx.session?.user.id

      return await GetAllPosts({
        limit, ctx, cursor,
        whereClause: currentUserId == null || !onlyFriends
          ? undefined
          : {
            user: {
              friends: { some: { id: currentUserId } },
            }
          }
      })
    }),
  create: protectedProcedure //must be authenticated to do this
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ input: { content }, ctx }) => {
      const post = await ctx.db.post.create({
        data: { content, userId: ctx.session.user.id },
      })

      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);

      return post
    }),
  togglePostLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const data = { userId: ctx.session.user.id, postId: id, }

      const existingPostLike = await ctx.db.like.findUnique({
        where: { userId_postId: data }
      });

      if (!existingPostLike) {
        await ctx.db.like.create({ data });
        return { addedLike: true };
      } else {
        await ctx.db.like.delete({
          where: { userId_postId: data }
        });
        return { addedLike: false };
      }
    })
});


async function GetAllPosts({
  whereClause, ctx, limit, cursor
}: {
  whereClause?: Prisma.PostWhereInput;
  limit: number;
  cursor: { id: string, createdAt: Date } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currentUserId = ctx.session?.user.id

  const data = await ctx.db.post.findMany({
    take: limit + 1,
    cursor: cursor
      ? { createdAt_id: cursor }
      : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: whereClause,
    select: {
      id: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes:
        currentUserId == null ? false : { where: { userId: currentUserId } },
      user: {
        select: { name: true, id: true, image: true }
      }
    }
  })

  let nextCursor: typeof cursor | undefined
  if (data.length > limit) {
    const nextItem = data.pop()
    if (nextItem !== undefined) {
      nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
    }
  }

  return {
    posts: data.map(post => {
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        likeCount: post._count.likes,
        user: post.user,
        likedByMe: post.likes.length > 0,
      }
    }), nextCursor
  }
}
