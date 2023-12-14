import type { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error"
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHover";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { AllPosts } from "~/components/AllPosts";
import { Button } from "~/components/Button";
import { useSession } from "next-auth/react";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ id }) => {
  const { data: profile } = api.profile.getById.useQuery({ id })
  const posts = api.post.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  const trcpUtils = api.useUtils()

  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trcpUtils.profile.getById.setData({ id }, oldData => {
        if (oldData == null) return

        const countModifier = addedFollow ? 1 : -1

        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier
        }
      })
    }
  })

  if (profile?.name == null) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <>
      <Head>
        <title>{`BoulderBook - ${profile.name}`}</title>
      </Head>
      <div className="min-h-screen flex-grow border-x">
        <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
          <Link href=".." className="mr-2">
            <IconHoverEffect>
              <VscArrowLeft className="h-6 w-6" />
            </IconHoverEffect>
          </Link>
          <ProfileImage src={profile.image} className="flex-shrink-0" />
          <div className="ml-2 flex-grow">
            <h1 className="text-lg font-bold"> {profile.name} </h1>
            <div className="text-gray-500">
              {profile.postsCount}{" "}
              {getPlural(Number(profile.postsCount), "Post", "Posts")} - {" "}
              {profile.followersCount}{" "}
              {getPlural(Number(profile.followersCount), "Follower", "Followers")} - {" "}
              {profile.followingCount} Following
            </div>
          </div>
          <AddFollowButton
            isFollowing={profile.isFollowing}
            isLoading={toggleFollow.isLoading}
            userId={id}
            onClick={() => toggleFollow.mutate({ userId: id })} />
        </header>
        <main>
          <AllPosts
            posts={posts.data?.pages.flatMap((page) => page.posts)}
            isError={posts.isError}
            isLoading={posts.isLoading}
            hasMore={posts.hasNextPage ?? false}
            fetchNewPosts={posts.fetchNextPage}
          />
        </main>
      </div>
    </>
  )
}

function AddFollowButton({ userId, isFollowing, isLoading, onClick }: {
  userId: string,
  isFollowing: boolean,
  onClick: () => void,
  isLoading: boolean
}) {
  const session = useSession()
  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null
  }
  return <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
    {isFollowing ? "Unfollow" : "Follow"}
  </Button>
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking"
  }
}


export async function getStaticProps(context: GetStaticPropsContext<{ id: string }>) {
  const id = context.params?.id

  if (id == undefined) {
    return {
      redirect: {
        destination: "/"
      }
    }
  }

  const ssg = ssgHelper()

  await ssg.profile.getById.prefetch({ id })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    }
  }
}

const pluralRules = new Intl.PluralRules()

function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural

}

export default ProfilePage 