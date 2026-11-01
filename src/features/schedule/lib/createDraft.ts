import {
  CAPACITY_DEFAULT,
  createScheduleDraftSchema,
  type CreateScheduleInput,
} from "../schemas/createScheduleSchema";
import { getEarliestStart } from "./startTime";

// 개설 입력값은 일정을 만들기 전까지 기기에 임시 보관한다(서버 저장 없음). 로그인하러 다녀와도 유지되게 탭 단위 저장소에 둔다
const DRAFT_KEY = "scheduleCreateDraft";

/** 처음 상태. 날짜·시작 시각 기본값은 지금 고를 수 있는 가장 이른 일시다 */
export function createEmptyDraft(): CreateScheduleInput {
  const earliest = getEarliestStart();
  return {
    activityId: null,
    place: null,
    title: "",
    duration: null,
    description: "",
    date: earliest.date,
    startTime: earliest.time,
    capacity: CAPACITY_DEFAULT,
  };
}

/** 보관한 입력값. 없거나 모양이 다르면 undefined */
export function loadDraft(): CreateScheduleInput | undefined {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return undefined;
    const result = createScheduleDraftSchema.safeParse(JSON.parse(saved));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function saveDraft(values: CreateScheduleInput) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이면 화면 안에서만 유지한다
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // saveDraft와 같다
  }
}
