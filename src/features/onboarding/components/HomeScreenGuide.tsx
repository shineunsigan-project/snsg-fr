import {
  ChevronDown,
  EllipsisVertical,
  Share,
  SquarePlus,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";

type HomeScreenGuideProps = {
  /** 아이폰·아이패드 → ONB-01(Safari 기준), 안드로이드 → ONB-01-1(Chrome 기준) (SHI-160 결정 Q5) */
  platform: "ios" | "android";
  onConfirm: () => void;
  onLater: () => void;
};

type Step = { text: ReactNode; icon: LucideIcon | "app" };

// 문구는 USER_FLOW §9.1 (시안 ONB-01·01-1)
const STEPS: Record<HomeScreenGuideProps["platform"], Step[]> = {
  ios: [
    {
      text: (
        <>
          <strong>공유 버튼</strong> 누르기
        </>
      ),
      icon: Share,
    },
    {
      text: (
        <>
          <strong>‘더 보기’</strong> 누르기
        </>
      ),
      icon: ChevronDown,
    },
    {
      text: (
        <>
          <strong>‘홈 화면에 추가’</strong> 선택
        </>
      ),
      icon: SquarePlus,
    },
    {
      text: (
        <>
          홈 화면의 <strong>쉬는시간 아이콘</strong>으로 실행
        </>
      ),
      icon: "app",
    },
  ],
  android: [
    {
      text: (
        <>
          주소창 오른쪽 ⋮ <strong>버튼</strong> 누르기
        </>
      ),
      icon: EllipsisVertical,
    },
    {
      text: (
        <>
          <strong>‘홈 화면에 추가’</strong> 선택
        </>
      ),
      icon: SquarePlus,
    },
    {
      text: (
        <>
          홈 화면의 <strong>쉬는시간 아이콘</strong>으로 실행
        </>
      ),
      icon: "app",
    },
  ],
};

/**
 * 홈 화면 추가 안내 ONB-01(아이폰)·ONB-01-1(안드로이드) 전체 화면 (USER_FLOW §9.1).
 * 시안의 상태바·Safari 툴바·Chrome 주소창은 기기 화면이라 그리지 않는다.
 * 본문이 길면 화면 전체가 스크롤되고 버튼은 하단에 붙는다
 */
export function HomeScreenGuide({
  platform,
  onConfirm,
  onLater,
}: HomeScreenGuideProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card">
      <main className="flex-1 px-5 pt-safe pb-6">
        <h1 className="pt-12 text-2xl leading-8.5 font-bold break-keep">
          홈 화면에 추가하고
          <br />더 편하게 이용해보세요
        </h1>
        <p className="mt-3 text-sm break-keep text-muted-foreground">
          홈 화면에 추가하면 주소를 입력하지 않고 앱처럼 바로 열 수 있어요.
        </p>

        <ol className="mt-5 flex flex-col gap-2">
          {STEPS[platform].map((step, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3"
            >
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 text-md break-keep text-foreground">
                {step.text}
              </p>
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground"
              >
                {step.icon === "app" ? (
                  // 장식 이미지라 대체 텍스트를 비운다
                  // TODO(D-18): 정식 앱 아이콘은 디자이너에게 받는다 (SHI-160 결정 Q3)
                  <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-lg"
                  />
                ) : (
                  <step.icon className="size-5" />
                )}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <BottomCta>
        <Button variant="primary" size="lg" onClick={onConfirm}>
          확인했어요
        </Button>
        <Button variant="text" className="h-11 text-sm" onClick={onLater}>
          나중에 할게요
        </Button>
      </BottomCta>
    </div>
  );
}
