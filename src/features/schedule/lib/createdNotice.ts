// 일정을 연 뒤 홈에서 개설 완료 팝업(CRT-07)을 한 번만 띄우려고, 만든 일정 ID를 탭 단위 저장소에 잠깐 둔다
// 팝업 내용은 이 ID로 서버에서 받는다. 홈이 읽자마자 지워서 새로고침이나 주소 직접 입력으로는 다시 뜨지 않는다
const CREATED_KEY = "scheduleCreated";

export function saveCreatedScheduleId(scheduleId: number) {
  try {
    sessionStorage.setItem(CREATED_KEY, String(scheduleId));
  } catch {
    // 저장소를 쓸 수 없으면 팝업 없이 홈만 보인다
  }
}

/** 보관한 일정 ID. 없으면 null */
export function readCreatedScheduleId() {
  try {
    const saved = Number(sessionStorage.getItem(CREATED_KEY));
    return Number.isInteger(saved) && saved > 0 ? saved : null;
  } catch {
    return null;
  }
}

export function clearCreatedScheduleId() {
  try {
    sessionStorage.removeItem(CREATED_KEY);
  } catch {
    // 지울 수 없어도 화면 동작에는 영향이 없다
  }
}
