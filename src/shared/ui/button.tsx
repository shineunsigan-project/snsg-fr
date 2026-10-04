import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

// shadcn Button을 기반으로 DESIGN §9.1의 변형만 둔다. 다른 변형(text)은 쓰는 화면을 만들 때 추가한다
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
