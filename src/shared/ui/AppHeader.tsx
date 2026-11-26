import Image from "next/image";
import Link from "next/link";

type AppHeaderProps = {
  /**
   * 화면에는 안 보이고 검색엔진·스크린리더가 읽는 대표 제목. 주면 이 글이 `h1`이 되고 로고는 `h1`이 아니다.
   * 없으면 로고(`쉬는시간`)가 `h1`이다
   */
  hiddenHeading?: string;
  /**
   * 대표 제목(`h1`)이 이 컴포넌트 밖(서버 컴포넌트)에 따로 있을 때 `false`. 로고가 `h1`이 아니게 해 `h1`이 하나만 남게 한다.
   * 기본은 `true`(로고가 `h1`)
   */
  logoIsHeading?: boolean;
};

// TODO(D-2): 목록 헤더가 로고형 / 타이틀형(`일정`) 중 무엇인지 확정되지 않아 Figma 홈(200:20789)의 로고형만 구현한다
export function AppHeader({
  hiddenHeading,
  logoIsHeading = true,
}: AppHeaderProps) {
  const LogoWrapper = hiddenHeading || !logoIsHeading ? "div" : "h1";
  return (
    <div className="flex h-8 items-center">
      {hiddenHeading && <h1 className="sr-only">{hiddenHeading}</h1>}
      <LogoWrapper>
        {/* 로고를 누르면 홈으로 간다. 터치 영역은 44px 높이로 잡는다 */}
        <Link href="/" className="flex min-h-11 items-center">
          <Image
            src="/images/snsg-logo.png"
            width={2720}
            height={937}
            // 높이 28px로 보여주므로 화면 밀도별로 작은 이미지만 받게 한다
            sizes="84px"
            alt="쉬는시간"
            priority
            className="h-7 w-auto"
          />
        </Link>
      </LogoWrapper>
    </div>
  );
}
