import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "~/utils/api";
import Link from "next/link";
function updateTextAreaHeight(textArea?: HTMLTextAreaElement) {
  if (textArea == null) return;
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

type EditPostFormProps = {
  postId: string;
  initialContent: string;
  onClose: () => void;
};

function Form({ postId, initialContent, onClose }: EditPostFormProps) {
  const session = useSession();
  const [inputValue, setInputValue] = useState(initialContent);
  const textAreaRef = useRef<HTMLTextAreaElement>();

  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaHeight(textArea);
    textAreaRef.current = textArea;
  }, []);

  useLayoutEffect(() => {
    updateTextAreaHeight(textAreaRef.current);
  }, [inputValue]);

  const trcpUtils = api.useUtils();

  const editPost = api.post.editPost.useMutation({
    onSuccess: async ({ updatedPost }) => {


      // Update infinite feed
      trcpUtils.post.infiniteFeed.setInfiniteData({}, (oldData) => {
        if (!oldData?.pages[0]) return oldData;

        const updatedPostList = {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              posts: oldData.pages[0].posts.map((post) =>
                post.id === updatedPost.id ? { ...post, content: updatedPost.content } : post
              ),
            },
            ...oldData.pages.slice(1),
          ],
        };

        return updatedPostList;
      });

      // Update infinite profile feed
      trcpUtils.post.infiniteProfileFeed.setInfiniteData({ userId: updatedPost.userId }, (oldData) => {
        if (!oldData?.pages[0]) return oldData;

        const updatedPostList = {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              posts: oldData.pages[0].posts.map((post) =>
                post.id === updatedPost.id ? { ...post, content: updatedPost.content } : post
              ),
            },
            ...oldData.pages.slice(1),
          ],
        };

        return updatedPostList;
      });

      onClose();
    }
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    editPost.mutate({ postId, content: inputValue });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4">
        <ProfileImage src={session.data?.user?.image} />
        <div className="flex flex-col w-full">
          <Link href={`/profiles/${session.data?.user.id}`} className="px-4 font-bold outline-none hover:underline focus-visible:underline">
            {session.data?.user.name}
          </Link>
          <textarea
            ref={inputRef}
            style={{ minHeight: '1rem' }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          >
          </textarea>
        </div>
      </div>
      <Button type="submit" className="self-end mr-16">Save</Button>
    </form>
  );
}

export function EditPostForm(props: EditPostFormProps) {
  const session = useSession();
  if (session.status !== "authenticated") return null;

  return <Form {...props} />;
}

