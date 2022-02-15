import { loginHandler } from "@storyofams/next-password-protect";

export default loginHandler(process.env.NEXT_BLOCKS_PASSWORD, {
  cookieName: "blocks-password-protect",
  cookieSameSite: "Lax",
});
