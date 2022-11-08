import { useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Spinner from "components/spinner";
import { Page } from "components/layout/page";

const { publicRuntimeConfig } = getConfig();

type Project = {
  slug: string;
  title: string;
  hasSignup: boolean;
  hasWaitlist: boolean;
  accessUrl: string | null;
};

const project: Project = {
  slug: "blocks",
  title: "GitHub Blocks",
  hasSignup: true,
  hasWaitlist: true,
  accessUrl: "https://blocks.githubnext.com",
};

type SignupResult = {
  login: string;
  email: string;
  alreadySignedUp: boolean;
  hasAccess: boolean;
};

type PreSignupResult = {
  login: string;
  email: string;
  alreadySignedUp: boolean;
  hasAccess: boolean;
};

const preSignup = async ({
  token,
  project,
}: {
  token: string;
  project: string;
}) => {
  const res = await fetch(
    process.env.NEXT_PUBLIC_FUNCTIONS_URL +
      "api/pre_signup?" +
      new URLSearchParams({ token, project })
  );
  return res.json();
};

const signup = async ({
  token,
  project,
}: {
  token: string;
  project: string;
}) => {
  const res = await fetch(
    process.env.NEXT_PUBLIC_FUNCTIONS_URL + "api/signup",
    {
      method: "PUT",
      body: new URLSearchParams({ token, project }),
    }
  );
  return res.json();
};

const remove = ({ token, project }: { token: string; project: string }) =>
  fetch(
    process.env.NEXT_PUBLIC_FUNCTIONS_URL +
      "api/remove?" +
      new URLSearchParams({ token, project }),
    { method: "DELETE" }
  );

type State =
  | { state: "start" }
  | { state: "session"; token: string }
  | {
      state: "preSignup";
      project: Project;
      token: string;
      result: PreSignupResult;
    }
  | { state: "submit"; project: Project; token: string }
  | { state: "signup"; project: Project; token: string; result: SignupResult }
  | { state: "error"; project: Project; error: unknown };

const Status = ({
  state: { project, token, result },
}: {
  state: State & { state: "preSignup" | "signup" };
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <p>
        Thanks <strong>@{result.login}</strong>, you're{" "}
        {result.alreadySignedUp ? "already" : "all"} signed up for{" "}
        {project.title}
        {result.hasAccess ? "" : " and are on the waitlist"}!
      </p>
      {result.hasAccess ? (
        <p>
          You can access {project.title} at{" "}
          <a href={project.accessUrl!}>{project.accessUrl}</a>.
        </p>
      ) : (
        <p>
          We'll send you an email at <strong>{result.email}</strong> to let you
          know when you get access.
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await remove({ token, project: project.slug });
          router.push({ pathname: `/` });
        }}
      >
        To remove yourself from the preview{result.hasAccess ? "" : " waitlist"}
        , click{" "}
        <button
          type="submit"
          className={
            "pt-2 pb-2 px-3 bg-black rounded-full text-white items-center justify-center transition-all focus:outline-none focus:ring focus:ring-gray-400 cursor-pointer"
          }
        >
          Remove me
        </button>
      </form>
    </div>
  );
};

const Signup = ({
  state,
  setState,
}: {
  state: State & { state: "preSignup" };
  setState: (_: State) => void;
}) => {
  const { project, token, result } = state;
  const [hasAccepted, setHasAccepted] = useState(false);

  const onSubmit = () => {
    if (!hasAccepted) return;

    setState({ state: "submit", project, token });
    signup({ token, project: project.slug }).then(
      (result) => setState({ state: "signup", project, token, result }),
      (error) => setState({ state: "error", project, error })
    );
  };

  return (
    <div className="px-6 max-w-4xl mx-auto pb-24">
      <form
        className="flex flex-col items-center space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!hasAccepted) return;
          onSubmit();
        }}
      >
        {project.hasWaitlist && (
          <p>
            We'll send you an email at <strong>{result.email}</strong> to let
            you know when you get access.
          </p>
        )}
        <label htmlFor="terms" className="flex items-center">
          <input
            className="mr-2 mt-[2px]"
            type="checkbox"
            id="terms"
            name="terms"
            checked={hasAccepted}
            onChange={(e) => setHasAccepted(e.target.checked)}
          />
          I accept the{" "}
          <Link href="https://github.com/githubnext/githubnext/blob/main/terms_of_service.md">
            <a className="ml-1 inline-block underline text-blue-500">
              GitHub Next Experiment Terms and Conditions
            </a>
          </Link>
        </label>
        <button
          type="submit"
          className={`pt-3 pb-4 px-8 bg-black rounded-full text-white flex items-center justify-center text-xl transition-all ${
            !hasAccepted
              ? "opacity-30 cursor-not-allowed"
              : "focus:outline-none focus:ring focus:ring-gray-400 cursor-pointer"
          }`}
          disabled={!hasAccepted}
        >
          Sign up
        </button>
      </form>
    </div>
  );
};

export default () => {
  const router = useRouter();
  const session = useSession({ required: true });
  const [state, setState] = useState<State>({ state: "start" });

  useEffect(() => {
    switch (state.state) {
      case "start": {
        if (session.status === "authenticated") {
          setState({ state: "session", token: session.data.token as string });
        }
        break;
      }

      case "session": {
        const { token } = state;
        preSignup({ token, project: project.slug }).then(
          (result) => setState({ state: "preSignup", project, token, result }),
          (error) => setState({ state: "error", project, error })
        );
        break;
      }

      case "error":
        console.log(state.error);
        router.push({ pathname: `/` });
        break;
    }
  }, [state, router.isReady, session.status]);

  if (state.state === "preSignup" || state.state === "signup") {
    let header: undefined | string = undefined;
    let body: React.ReactNode = undefined;

    if (state.state === "preSignup" && !state.result.alreadySignedUp) {
      const { project } = state;
      header = `Sign up for ${project.title}`;
      body = <Signup state={state} setState={setState} />;
    } else {
      const { project, result } = state;
      header = `You're ${
        result.alreadySignedUp ? "already " : ""
      }signed up for ${project.title}!`;
      body = <Status state={state} />;
    }

    return (
      <Page>
        <Page.Nav />
        <Page.Header heading={header}></Page.Header>
        <div className="px-6 max-w-4xl mx-auto pb-24">{body}</div>

        <Link href={`/`}>
          <a className="block text-center text-blue-500 hover:text-blue-600">
            Back to reading about {project.title}
          </a>
        </Link>
      </Page>
    );
  } else {
    return (
      <Page>
        <Page.Nav />
        <div className="grid">
          <div className="justify-self-center">
            <Spinner />
          </div>
        </div>
      </Page>
    );
  }
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const devServer = context.query.devServer as string;

  const isDev = process.env.NODE_ENV !== "production";

  const frameSrc = ["frame-src", publicRuntimeConfig.sandboxDomain, devServer]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src",
    "'self'",
    // for local dev
    isDev && "webpack://*",
    isDev && "ws://*",
    // for access checking
    process.env.NEXT_PUBLIC_FUNCTIONS_URL,
    // for hitting the GitHub API
    "https://api.github.com/",
    // for Analytics
    "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    "https://eastus-8.in.applicationinsights.azure.com/",
    devServer,
  ]
    .filter(Boolean)
    .join(" ");

  context.res.setHeader(
    "Content-Security-Policy",
    [context.res.getHeader("Content-Security-Policy"), frameSrc, connectSrc]
      .filter(Boolean)
      .join(";")
  );

  return { props: {} };
}
