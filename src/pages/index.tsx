import { type NextPage } from "next"
import { useSession, } from "next-auth/react"
import { useState, useEffect } from "react"
import { AllPosts } from "~/components/AllPosts"
import { LoadingSpinner } from "~/components/LoadingSpinner"
import { NewPostForm } from "~/components/NewPostForm"
import { api } from "~/utils/api"

const Tabs = ["Recent", "Following"] as const


const Home: NextPage = () => {
  const session = useSession()
  const [selectedTab, setSelectedTab] = useState<(typeof Tabs)[number]>("Recent")
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false once the session status is determined
    if (session.status !== 'loading') {
      setLoading(false);
    }
  }, [session.status]);

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <>
      {session.status === "authenticated" && (
        <>
          <header className="sticky top-0  z-10 border-b p-2 bg-white">
            <div className=" m-2 ">Home</div>

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
          </header>
          <NewPostForm />

          {selectedTab === "Recent"
            ? <RecentPosts />
            : <FollowingPosts />
          }
        </>
      )}
      {session.status !== "authenticated" && (
        <>
          <header className="header">
            <div className="title m-2">BoulderBuddy</div>
          </header>
          <div className="mainbg">

          </div>

        </>
      )}
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

function FollowingPosts() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true },
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