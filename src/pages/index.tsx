import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { AllPosts } from "~/components/AllPosts"
import { LoadingSpinner } from "~/components/LoadingSpinner"
import { NewPostForm } from "~/components/NewPostForm"
import { api } from "~/utils/api"
import Link from "next/link"
const Tabs = ["Recent", "Following"] as const


const Home: NextPage = () => {
  const session = useSession()
  const [selectedTab, setSelectedTab] = useState<(typeof Tabs)[number]>("Recent")

  if (session.status === "loading") {
    return <LoadingSpinner />
  }

  return (
    <>
      {session.status === "authenticated"
        ?
        <>
          <Link href="/">
            <div className="maintitle ">BoulderBuddy</div>
          </Link>
          <header className="mainheader sticky z-10 border-b pt-2 pr-2 pl-2 bg-white">


            <div className="bg-white flex">{Tabs.map((tab) => {
              return (
                <button
                  key={tab}
                  className={`label text-xl flex-grow p-2 hover:bg-gray-200 focus-visible:bg-gray-200 
                  ${tab === selectedTab
                      ? "border-b-8 border-b-blue-500 font-bold"
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

          <div className="postform fixed z-10 border-y">
            <NewPostForm />
          </div>
          <div className="postctn">
            {selectedTab === "Recent"
              ? <RecentPosts />
              : <FollowingPosts />
            }
          </div>
        </>
        :
        <>
          <header className="header">
            <div className="title m-2">BoulderBuddy</div>
          </header>
          <div className="mainbg">

          </div>

        </>
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
      customHeight={'calc(100vh - 17rem)'}
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
      customHeight={'calc(100vh - 17rem)'}
    />
  )
}

export default Home