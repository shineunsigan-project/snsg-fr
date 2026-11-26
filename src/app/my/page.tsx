import { MyProfileScreen } from "@/features/profile/components/MyProfileScreen";
import { NO_INDEX_METADATA } from "@/shared/lib/seo";

export const metadata = NO_INDEX_METADATA;

export default function MyPage() {
  return <MyProfileScreen />;
}
