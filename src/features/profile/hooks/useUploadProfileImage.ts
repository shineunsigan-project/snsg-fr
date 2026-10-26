import { useMutation } from "@tanstack/react-query";

import { postProfileImage } from "../api/signup";

export function useUploadProfileImage() {
  return useMutation({ mutationFn: postProfileImage });
}
