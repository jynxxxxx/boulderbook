import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { AllPosts } from "~/components/AllPosts"
import { NewPostForm } from "~/components/NewPostForm"
import { api } from "~/utils/api"

const Tabs = ["Recent", "Friends"] as const

const Home: NextPage = () => {
  const session = useSession()
  const [selectedTab, setSelectedTab] = useState<(typeof Tabs)[number]>("Recent")

  return (
    <>
      <header className="sticky top-0 z-10 border-b pt-2">
        <div className="header mb-2">Home</div>
        {session.status === "authenticated" && (
          <div className="flex">{Tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`flex-grow p-2 hover:bg-gray-200 focus-visible:bg-gray-200 
                  ${tab === selectedTab
                    ? "border-b-4 border-b-blue-500 font-bold"
                    : ""
                  }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </button>
            )
          })}
          </div>
        )}
      </header>
      <NewPostForm />

      {selectedTab === "Recent"
        ? <RecentPosts />
        : <FriendsPosts />
      }

    </>
  )
}


function RecentPosts() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    {},
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  return (
    <AllPosts
      posts={posts.data?.pages.flatMap((page) => page.posts)}
      isError={posts.isError}
      isLoading={posts.isLoading}
      hasMore={posts.hasNextPage ?? false}
      fetchNewPosts={posts.fetchNextPage}
    />
  )
}

function FriendsPosts() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    { onlyFriends: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  return (
    <AllPosts
      posts={posts.data?.pages.flatMap((page) => page.posts)}
      isError={posts.isError}
      isLoading={posts.isLoading}
      hasMore={posts.hasNextPage ?? false}
      fetchNewPosts={posts.fetchNextPage}
    />
  )
}

export default Home