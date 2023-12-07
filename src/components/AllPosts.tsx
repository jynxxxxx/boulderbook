import Link from "next/link"
import InfiniteScroll from "react-infinite-scroll-component"
import { ProfileImage } from "./ProfileImage"
import { useSession } from "next-auth/react"
import { VscHeart, VscHeartFilled } from "react-icons/vsc"
import { IconHoverEffect } from "./IconHover"
import { api } from "~/utils/api"
import { LoadingSpinner } from "./LoadingSpinner"

type Post = {
  id: string,
  content: string,
  createdAt: Date,
  likeCount: number
  likedByMe: boolean
  user: { id: string; image: string | null; name: string | null }
}

type AllPostsProps = {
  isLoading: boolean
  isError: boolean
  hasMore: boolean
  fetchNewPosts: () => Promise<unknown>
  posts: Post[] | undefined
}



export function AllPosts({ posts, isError, isLoading, hasMore, fetchNewPosts }: AllPostsProps) {
  if (isLoading) return <h1><LoadingSpinner /></h1>
  if (isError) return <h1>Error</h1>

  if (posts?.length == 0 || posts == null) {
    return <h2> No Posts </h2>
  }

  return <ul>
    <InfiniteScroll
      dataLength={posts.length}
      next={fetchNewPosts}
      hasMore={hasMore}
      loader={<LoadingSpinner />}
    >
      {posts?.map(post => (
        <PostCard key={post.id} {...post} />
      ))}
    </InfiniteScroll>
  </ul>
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function PostCard({ id, content, createdAt, likeCount, likedByMe, user }: Post) {
  const trcpUtils = api.useUtils()
  const togglePostLike = api.post.togglePostLike.useMutation(
    {
      onSuccess: async ({ addedLike }) => {
        const updateData: Parameters<typeof trcpUtils.post.infiniteFeed.setInfiniteData>[1] = (oldData) => {

          if (oldData == null) return

          const countModifier = addedLike ? 1 : -1

          const updatedData = {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                ...page,
                posts: page.posts.map(post => {
                  if (post.id === id) {
                    return {
                      ...post,
                      likeCount: post.likeCount + countModifier,
                      likedByMe: addedLike
                    }
                  }
                  return post
                })
              }
            })
          }
          return updatedData
        }

        trcpUtils.post.infiniteFeed.setInfiniteData({}, updateData)
        trcpUtils.post.infiniteFeed.setInfiniteData({ onlyFriends: true }, updateData)
        trcpUtils.post.infiniteProfileFeed.setInfiniteData({ userId: user.id }, updateData)
      }
    })

  function handleTogglePostLike() {
    togglePostLike.mutate({ id })

  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image}></ProfileImage>
      </Link>
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link href={`/profiles/${user.id}`} className="font-bold outline-none hover:underline focus-visible:underline">
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">{dateTimeFormatter.format(createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
        <HeartButton
          onClick={handleTogglePostLike}
          isLoading={togglePostLike.isLoading}
          likedByMe={likedByMe}
          likeCount={likeCount}
        />
      </div>
    </li>
  )
}

type HeartButtonProps = {
  onClick: () => void
  isLoading: boolean
  likedByMe: boolean
  likeCount: number
}

function HeartButton({ isLoading, onClick, likedByMe, likeCount }: HeartButtonProps) {
  const session = useSession()
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    )
  }

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 
        ${likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"}`}>
      <IconHoverEffect red>
        <HeartIcon className={`transition-colors duration-200 
          ${likedByMe
            ? "fill-red-500"
            : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"}`}
        />
        <span>{likeCount}</span>
      </IconHoverEffect>
    </button>
  )
}
