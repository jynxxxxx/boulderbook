import { signOut, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { IconHoverEffect } from "./IconHover";
import { VscAccount, VscHome, VscSignOut, VscSignIn } from "react-icons/vsc";
import { SignUpForm } from "./SignUpForm";
import { LoadingSpinner } from "~/components/LoadingSpinner"

export function SideNav() {
  const session = useSession()

  const user = session.data?.user

  console.log("Session:", session);

  if (session.status === "loading") {
    return <LoadingSpinner />
  }

  return (

    <>
      {session.status === "authenticated"
        ?
        <>
          <nav className="mainbar sticky px-6 py-4 w-1/5 h-full " style={{ minHeight: 'calc(100vh - 5.5rem)' }}>
            <ul className="flex flex-grow flex-col items-start gap-2 whitespace-nowrap ">
              <li>
                <Link href="/">
                  <IconHoverEffect additionalClasses="bg-white/50">
                    <span className="flex  items-center gap-4">
                      <VscHome className="h-8 w-8" />
                      <span className="hidden text-lg md:inline">Home</span>
                    </span>
                  </IconHoverEffect>
                </Link>
              </li>
              {user != null && <li>
                <Link href={`/profiles/${user.id}`}>
                  <IconHoverEffect additionalClasses="bg-white/50">
                    <span className="flex items-center gap-4">
                      <VscAccount className="h-8 w-8" />
                      <span className="hidden text-lg md:inline">Profile</span>
                    </span>
                  </IconHoverEffect>
                </Link>
              </li>}
            </ul>
          </nav>
          <div className="fixed bottom-10 left-0 px-6">
            <button onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignOut className="h-8 w-8 fill-red-700" />
                  <span className="hidden text-lg md:inline text-red-700">Logout</span>
                </span>
              </IconHoverEffect>
            </button>
          </div>
        </>
        :
        <nav className="sticky top-0 px-2 py-4 w-2/5 min-w-1/3 min-h-screen bg-black ">
          <div className="signupdiv p-4 ">
            <div className="label font-bold m-5 text-center text-xl"> Sign Up </div>
            <SignUpForm />
            <div className="w-full flex flex-col items-end mr-16 mt-16 ">
              <div className="text-gray-500">Already a buddy or a Discord member?</div>
              <button onClick={() => void signIn()}>
                <IconHoverEffect>
                  <span className="flex items-center gap-4 ">
                    <VscSignIn className="h-8 w-8 " />
                    <span className="loginbtn hidden text-lg md:inline ">Login</span>
                  </span>
                </IconHoverEffect>
              </button>
            </div>
          </div>
        </nav>

      }
    </>
  )
}