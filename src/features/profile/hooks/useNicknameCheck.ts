import { skipToken, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getNicknameAvailability } from "../api/nicknameAvailability";
import {
  DUPLICATED_NICKNAME_MESSAGE,
  NICKNAME_FORMAT_MESSAGE,
  profileSchema,
} from "../schemas/profileSchema";
import { profileQueryKeys } from "./profileQueryKeys";

/** 닉네임 칸 아래 결과 문구. 사용 가능은 녹색, 그 밖은 빨강 (USER_FLOW §4.1 유효성 검사 문구) */
export type NicknameCheckMessage = {
  tone: "success" | "error";
  message: string;
};

/**
 * 닉네임 칸을 벗어날 때 서버에 사용 가능 여부를 묻는다 (USER_FLOW §4.1, SHI-165 결정 4). 가입·프로필 수정이 같이 쓴다
 * - check(value): 칸을 벗어날 때 부른다. 화면 형식 검사를 통과한 값만 묻는다. 부를지 말지(MY-02 지금 닉네임·잠금)는 화면이 정한다
 * - reset(): 값을 고치면 부른다. 결과 문구를 지운다 (forms 규칙)
 * - message: 지금 칸의 값(nickname)을 물은 결과만 돌려준다. 늦게 온 이전 값의 응답은 보여주지 않는다
 * 제출 때는 다시 묻지 않는다. 중복은 저장 요청의 409로 다시 확인한다 (SHI-165 결정 5)
 */
export function useNicknameCheck(nickname: string) {
  const [checkedNickname, setCheckedNickname] = useState<string>();
  const { data, isError, refetch } = useQuery({
    queryKey: profileQueryKeys.nicknameAvailability(checkedNickname ?? ""),
    queryFn:
      checkedNickname === undefined
        ? skipToken
        : () => getNicknameAvailability(checkedNickname),
    // 실패하면 바로 알린다. 칸을 다시 벗어나면 다시 묻는다
    retry: false,
  });

  const check = (value: string) => {
    const parsed = profileSchema.shape.nickname.safeParse(value);
    if (!parsed.success) {
      setCheckedNickname(undefined);
      return;
    }
    // 같은 값을 다시 벗어나면 상태가 바뀌지 않으므로 실패했을 때만 직접 다시 묻는다
    if (parsed.data === checkedNickname && isError) void refetch();
    setCheckedNickname(parsed.data);
  };

  const reset = () => setCheckedNickname(undefined);

  let message: NicknameCheckMessage | undefined;
  if (checkedNickname !== undefined && checkedNickname === nickname.trim()) {
    if (isError) {
      message = {
        tone: "error",
        message: "닉네임을 확인하지 못했어요. 잠시 후 다시 시도해주세요.",
      };
    } else if (data?.available) {
      message = { tone: "success", message: "사용할 수 있는 닉네임이에요." };
    } else if (data?.reason === "DUPLICATED") {
      message = { tone: "error", message: DUPLICATED_NICKNAME_MESSAGE };
    } else if (data?.reason === "INVALID_FORMAT") {
      // 화면 형식 검사를 통과했는데 서버 기준에 맞지 않을 때. 화면의 형식 문구를 보여준다
      message = { tone: "error", message: NICKNAME_FORMAT_MESSAGE };
    }
  }

  return { check, reset, message };
}
