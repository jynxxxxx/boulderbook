import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "~/utils/api";

function updateTextAreaHeight(textArea?: HTMLTextAreaElement) {
  if (textArea == null) return
  textArea.style.height = "0"
  textArea.style.height = `${textArea.scrollHeight}px`
}

function Form() {
  const session = useSession()
  const [inputValue, setInputValue] = useState("")
  const textAreaRef = useRef<HTMLTextAreaElement>()

  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaHeight(textArea);
    textAreaRef.current = textArea
  }, [])

  useLayoutEffect(() => {
    updateTextAreaHeight(textAreaRef.current)
  }, [inputValue])

  const trcpUtils = api.useUtils()

  const createPost = api.post.create.useMutation({
    onSuccess: (newPost) => {
      setInputValue("")

      trcpUtils.post.infiniteFeed.setInfiniteData({}, (oldData) => {

        if (oldData?.pages[0] == null) return

        if (session.status !== "authenticated") return

        const newestPost = {
          ...newPost,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data.user.id,
            name: session.data.user.name ?? null,
            image: session.data.user.image ?? null
          }
        }

        const updatedPostList = {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              posts: [newestPost, ...oldData.pages[0].posts]
            },
            ...oldData.pages.slice(1),
          ]
        }

        return updatedPostList
      })
    }
  })


  if (session.status !== "authenticated") return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    createPost.mutate({ content: inputValue })
  }


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4">
        <ProfileImage src={session.data.user?.image} />
        <textarea
          ref={inputRef}
          style={{ minHeight: '1rem' }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          placeholder="Where are you climbing?">
        </textarea>
      </div>
      <Button className="self-end mr-16">Post</Button>
    </form>
  )
}


export function NewPostForm() {
  const session = useSession()
  if (session.status !== "authenticated") return

  return <Form />
}