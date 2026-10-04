"use client";

import { Pencil } from "lucide-react";
import { useRef } from "react";

type AvatarEditorProps = {
  /** 보여줄 프로필 사진 URL (소셜 프로필 사진 또는 새로 고른 사진의 미리보기). 없으면 기본 원형 */
  imageUrl?: string;
  /** 사용자가 기기에서 사진을 고르면 호출된다 */
  onFileSelect?: (file: File) => void;
};

/** 원형 프로필 이미지 + 오른쪽 아래 원형 편집 버튼 (DESIGN §9.1 Avatar Editor) */
export function AvatarEditor({ imageUrl, onFileSelect }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative size-20">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 소셜 프로필 이미지·로컬 미리보기(blob URL)라 next/image 최적화 대상이 아니다
        <img
          src={imageUrl}
          alt="프로필 사진"
          className="size-full rounded-full object-cover"
        />
      ) : (
        <div aria-hidden className="size-full rounded-full bg-stripe" />
      )}
      <button
        type="button"
        aria-label="프로필 사진 변경"
        onClick={() => inputRef.current?.click()}
        className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border border-input bg-card text-foreground"
      >
        <Pencil aria-hidden className="size-3.5" />
      </button>
      {/* TODO(F-15): 웹뷰에서 갤러리 권한 요청·사진 선택을 앱(네이티브)이 처리할지 정해지면 맞춘다 (USER_FLOW §8) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelect?.(file);
          // 같은 파일을 다시 골라도 change 이벤트가 나도록 비운다
          event.target.value = "";
        }}
      />
    </div>
  );
}
