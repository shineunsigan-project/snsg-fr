// 일정을 연 뒤 개설한 일정 탭에서 완료 팝업(CRT-07)과 새 일정 강조를 한 번만 보여주려고, 연 일정의 ID와 장소명을 탭 단위 저장소에 잠깐 둔다
// 개설 응답에는 일정 ID만 오므로 팝업 장소명은 개설 화면에서 고른 값을 쓴다
// 홈이 읽자마자 지워서 새로고침이나 주소 직접 입력으로는 다시 뜨지 않는다
// 예전 키(`scheduleCreated`, `scheduleCreatedPlace`)의 값과 섞이지 않게 새 키를 쓴다
const CREATED_KEY = "scheduleCreatedNotice";

export type CreatedNotice = { scheduleId: string; placeName: string };

export function saveCreatedNotice(notice: CreatedNotice) {
  try {
    sessionStorage.setItem(CREATED_KEY, JSON.stringify(notice));
  } catch {
    // 저장소를 쓸 수 없으면 팝업 없이 목록만 보인다
  }
}

/** 보관한 개설 정보. 없거나 모양이 다르면 null */
export function readCreatedNotice(): CreatedNotice | null {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(CREATED_KEY) ?? "null",
    );
    if (
      typeof saved === "object" &&
      saved !== null &&
      "scheduleId" in saved &&
      typeof saved.scheduleId === "string" &&
      "placeName" in saved &&
      typeof saved.placeName === "string"
    ) {
      return { scheduleId: saved.scheduleId, placeName: saved.placeName };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearCreatedNotice() {
  try {
    sessionStorage.removeItem(CREATED_KEY);
  } catch {
    // 지울 수 없어도 화면 동작에는 영향이 없다
  }
}
