import { ChevronDown, ChevronUp } from "lucide-react";

import type { ParticipantRow } from "../../lib/scheduleDetailView";
import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/lib/utils";
import { Tag } from "@/shared/ui/Tag";

type ParticipantSectionProps = {
  /** 개설자 포함 확정 인원 */
  participantCount: number;
  /** `남 2 · 여 2 · 20대 후반–30대 초반` */
  summaryLabel: string;
  /** 펼친 명단 제목 줄의 성별 수 `남 2 · 여 2` (시안 DTL-06) */
  genderLabel: string;
  /** 겹쳐 보일 아바타(최대 4개, Q6). null이면 기본 아바타 */
  avatars: (string | null)[];
  /** 확정 참여자·개설자만 펼친다. false면 펼치기 버튼이 없다 (F-6) */
  canExpand: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  /** 펼쳤을 때의 명단. 불러오는 중이면 undefined */
  rows: ParticipantRow[] | undefined;
  /** 명단을 못 불러왔다 */
  isRowsError: boolean;
  onRetryRows: () => void;
};

/**
 * 참여자 요약과 명단 펼침 (시안 DTL-01·DTL-06·HOST-02).
 * 접힘: `참여자 n` + 겹친 아바타 + 요약. 펼침: 연두 테두리 카드 안에 제목과 명단(구분선).
 * 펼치고 접어도 제목 버튼은 같은 자리에 남아 포커스를 잃지 않는다
 */
export function ParticipantSection({
  participantCount,
  summaryLabel,
  genderLabel,
  avatars,
  canExpand,
  isExpanded,
  onToggle,
  rows,
  isRowsError,
  onRetryRows,
}: ParticipantSectionProps) {
  const isOpen = canExpand && isExpanded;
  const heading = (
    <>
      <span className="shrink-0 text-base font-bold">
        참여자 <span className="text-primary">{participantCount}</span>
      </span>
      {isOpen && (
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {genderLabel}
        </span>
      )}
      {canExpand &&
        (isOpen ? (
          <ChevronUp
            aria-hidden
            className="ml-auto size-5 shrink-0 text-muted-foreground"
          />
        ) : (
          <ChevronDown
            aria-hidden
            className="ml-auto size-5 shrink-0 text-muted-foreground"
          />
        ))}
    </>
  );
  const headingClassName = cn(
    "flex min-h-11 w-full items-center gap-2 text-left",
    isOpen && "min-h-14 px-5",
  );

  return (
    <section className="px-5 pt-5">
      <div className={cn(isOpen && "rounded-2xl border-2 border-brand-border")}>
        <h2>
          {canExpand ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={onToggle}
              className={cn(
                headingClassName,
                "rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              {heading}
            </button>
          ) : (
            <span className={headingClassName}>{heading}</span>
          )}
        </h2>
        {isOpen ? (
          <ParticipantList
            rows={rows}
            isError={isRowsError}
            onRetry={onRetryRows}
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 -space-x-2">
              {avatars.map((src, index) => (
                // 같은 사진(기본 아바타 null 등)이 여러 개일 수 있어 순서로 구분한다. 목록은 다시 정렬하지 않는다
                <Avatar key={index} src={src} className="ring-2 ring-card" />
              ))}
            </span>
            <p className="min-w-0 text-sm break-keep text-muted-foreground">
              {summaryLabel}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ParticipantList({
  rows,
  isError,
  onRetry,
}: {
  rows: ParticipantRow[] | undefined;
  isError: boolean;
  onRetry: () => void;
}) {
  if (rows === undefined) {
    // TODO(D-5): 명단 불러오는 중·실패 표시 디자인 없음. 텍스트만 둔다
    return isError ? (
      <p className="flex items-center gap-2 px-5 pb-2 text-sm text-muted-foreground">
        명단을 불러오지 못했어요.
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 font-semibold text-foreground"
        >
          다시 시도
        </button>
      </p>
    ) : (
      <p role="status" className="px-5 pb-4 text-sm text-muted-foreground">
        불러오는 중...
      </p>
    );
  }
  return (
    <ul
      aria-label="참여자 명단"
      className="mx-5 flex flex-col divide-y divide-border border-t border-border"
    >
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3 py-2.5">
          <Avatar src={row.profileImageUrl} className="size-10" />
          <div className="flex min-w-0 flex-col">
            <p className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-md font-bold">{row.name}</span>
              {row.isHost && <Tag tone="brand">개설자</Tag>}
            </p>
            {row.detail && (
              <span className="text-sm text-muted-foreground">
                {row.detail}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
