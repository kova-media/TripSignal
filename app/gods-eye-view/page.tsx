import type { Metadata } from 'next';
import GodsEyeView from '@/components/gods-eye-view';

export const metadata: Metadata = {
  title: "God's Eye View",
  description:
    'Explore a live 3D globe with public aviation, satellite, earthquake and infrastructure data.',
  robots: { index: false, follow: false },
};

export default function GodsEyeViewPage() {
  return <GodsEyeView />;
}
