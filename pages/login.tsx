import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { GoMarkGithub } from "react-icons/go";

export function SignInButton() {
  return (
    <button
      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      onClick={() => signIn(null, { callbackUrl: "/" })}
    >
      <GoMarkGithub />
      <span className="ml-2">Sign in with GitHub</span>
    </button>
  );
}

export default function Test() {
  const { data: session } = useSession();

  return (
    <div className="h-screen flex items-center justify-center">
      {session ? (
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      ) : (
        <SignInButton />
      )}
    </div>
  );
}
