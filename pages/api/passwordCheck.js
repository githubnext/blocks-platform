import { passwordCheckHandler } from "@storyofams/next-password-protect";

export default passwordCheckHandler(process.env.NEXT_BLOCKS_PASSWORD, {
  cookieName: "blocks-password-protect",
  cookieSameSite: "Lax",
});
