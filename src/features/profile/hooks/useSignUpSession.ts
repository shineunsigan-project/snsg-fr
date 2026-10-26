import { useQuery } from "@tanstack/react-query";

import { getSignUpSession } from "../api/signup";

export function useSignUpSession() {
  return useQuery({
    queryKey: ["auth", "signup", "session"],
    queryFn: getSignUpSession,
    // 만료(401)는 다시 불러도 같으므로 재시도하지 않는다
    retry: false,
    staleTime: Infinity,
  });
}
