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
import { SideNav } from "~/components/SideNav";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ id }) => {
  const { data: profile } = api.profile.getById.useQuery({ id })
  const posts = api.post.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  const trcpUtils = api.useUtils()

  const toggleFriend = api.profile.toggleFriend.useMutation({
    onSuccess: ({ addedFriend }) => {
      trcpUtils.profile.getById.setData({ id }, oldData => {
        if (oldData == null) return

        const countModifier = addedFriend ? 1 : -1

        return {
          ...oldData,
          areFriends: addedFriend,
          friendsCount: oldData.friendsCount + countModifier
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
      <SideNav />
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
              {getPlural(profile.postsCount, "Post", "Posts")} - {" "}
              {profile.friendsCount}{" "}
              {getPlural(profile.friendsCount, "Friend", "Friends")}
            </div>
          </div>
          <AddFriendButton
            areFriends={profile.areFriends}
            isLoading={toggleFriend.isLoading}
            userId={id}
            onClick={() => toggleFriend.mutate({ userId: id })} />
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

function AddFriendButton({ userId, areFriends, isLoading, onClick }: {
  userId: string,
  areFriends: boolean,
  onClick: () => void,
  isLoading: boolean
}) {
  const session = useSession()
  if (session.status !== "authenticated" || session.data.user.id) {
    return null
  }
  return <Button disabled={isLoading} onClick={onClick} small gray={areFriends}>
    {areFriends ? "Remove Friend" : "Add Friend"}
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