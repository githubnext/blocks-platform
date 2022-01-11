import { loginHandler } from "@storyofams/next-password-protect";

export default loginHandler("espresso", {
  cookieName: "blocks-password-protect",
});