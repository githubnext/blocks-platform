import { passwordCheckHandler } from "@storyofams/next-password-protect";

export default passwordCheckHandler("espresso", {
  cookieName: "blocks-password-protect",
});