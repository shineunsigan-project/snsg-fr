import { useMutation } from "@tanstack/react-query";

import { postSignup } from "../api/signup";

export function useSignup() {
  return useMutation({ mutationFn: postSignup });
}
