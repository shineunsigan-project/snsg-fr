import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

// shadcn Button을 기반으로 DESIGN §9.1의 변형만 둔다. 다른 변형(text)은 쓰는 화면을 만들 때 추가한다
// 아이콘은 children으로 넣는다 (상세 하단 `⊘`·`●`)
// 카카오·네이버 로그인은 코드로 그리지 않고 공식 이미지를 쓴다 → SocialLoginButton
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl font-bold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        /** 녹색 배경 위 흰 외곽선 (로그인 화면 `로그인 없이 둘러보기`) */
        "outline-inverse": "border border-white/30 text-white",
        /** 파괴적 동작: 일정 전체 취소, 확인 팝업 `확인`·`초기화` (시안 HOST-01·DTL-07·CRT-06 수정안) */
        danger: "bg-danger text-white",
        /** 참여 취소 (시안 DTL-05) */
        "danger-soft": "border border-danger-border bg-danger-soft text-danger",
        /**
         * 일정 상태 때문에 누를 수 없는 상세 하단 버튼 `⊘ 모집 마감`·`⊘ 일정 취소됨`·`⊘ 일정 완료` (시안 DTL-08).
         * inactive·in-progress는 disabled와 함께 쓰고, 시안 색 그대로 보이도록 disabled 투명도를 끈다
         */
        inactive: "bg-inactive text-subtle-foreground disabled:opacity-100",
        /** `● 활동 진행 중` (시안 DTL-08 활동 진행 중) */
        "in-progress":
          "border border-brand-border bg-brand-soft text-brand disabled:opacity-100",
      },
      size: {
        default: "h-13 px-4 text-base",
        lg: "h-14 px-4 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    variant: NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
  };

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
