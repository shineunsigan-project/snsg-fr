import Image from "next/image";

/** 서비스 소개 페이지 (USER_FLOW §5.1). 새 창으로 연다 */
const SERVICE_INTRO_URL = "https://info.shineunsigan.com";

/**
 * 메인 배너 (LIST-06-1). 배경 이미지 위에 문구와 `서비스 소개 보기 ↗`를 코드로 얹는다 (사용자 결정 2026-11-21).
 * 배치는 레퍼런스 `메인배너 레퍼런스.jpg`를 따른다: 가로로 넓은 배너, 글자는 왼쪽 절반에 세로 가운데, 오른쪽은 사진이 보이게 둔다.
 * 높이는 최소 높이만 둔다. `aspect-2/1`과 `min-h-48`을 같이 쓰면 아이폰 사파리에서 배너가 화면 오른쪽으로 넘쳤다(2026-11-23 스크린샷). 비율이 최소 높이를 폭으로 넘기는 것으로 추정한다
 * 배너 전체가 서비스 소개로 가는 링크다. 마우스를 올리면(또는 키보드로 닿으면) 버튼이 새로 열린 일정의 선택된 칩 색으로 바뀐다(사용자 요청 2026-11-22). 이미지를 못 불러오면 배경색과 문구만 보인다.
 * 레퍼런스의 로고·슬라이드 위치 표시는 기획에 없어 넣지 않는다
 */
export function MainBanner() {
  return (
    <a
      href={SERVICE_INTRO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative isolate flex min-h-48 items-center overflow-hidden rounded-2xl bg-brand text-primary-foreground focus-visible:outline-3 focus-visible:outline-ring/50"
    >
      <Image
        src="/images/home-banner.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 28rem) 28rem, 100vw"
        className="-z-20 object-cover"
      />
      {/* 왼쪽 글자가 이미지 위에서 읽히도록 왼쪽에서 오른쪽으로 옅어지는 어두운 막을 깐다 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-black/65 via-black/35 to-transparent"
      />
      <div className="flex flex-col items-start gap-4 px-5">
        <p className="text-xl leading-snug font-bold whitespace-nowrap">
          보드게임·방탈출 모임,
          <br />
          망설이지 말고 직접 열어요
        </p>
        <span className="flex h-9 items-center rounded-full border border-primary-foreground/60 px-4 text-sm font-semibold transition-colors group-hover:border-brand-border group-hover:bg-brand-soft group-hover:text-brand group-focus-visible:border-brand-border group-focus-visible:bg-brand-soft group-focus-visible:text-brand">
          서비스 소개 보기 ↗<span className="sr-only">(새 창)</span>
        </span>
      </div>
    </a>
  );
}
