import Image from "next/image";
import Link from "next/link";

// TODO(D-2): 목록 헤더가 로고형 / 타이틀형(`일정`) 중 무엇인지 확정되지 않아 Figma 홈(200:20789)의 로고형만 구현한다
export function AppHeader() {
  return (
    <div className="flex h-8 items-center">
      <h1>
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
      </h1>
    </div>
  );
}
