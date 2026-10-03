// TODO(D-2): 목록 헤더가 로고형 / 타이틀형(`일정`) 중 무엇인지 확정되지 않아 Figma 홈(200:20789)의 로고형만 구현한다
// TODO: 로고 에셋을 받으면 텍스트 로고를 이미지로 교체한다
export function AppHeader() {
  return (
    <div className="flex h-8 items-center">
      <h1 className="text-2xl font-bold text-brand">쉬는시간</h1>
    </div>
  );
}
