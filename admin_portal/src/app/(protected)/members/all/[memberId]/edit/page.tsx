import { notFound } from 'next/navigation';
import { MemberFormPage } from '@/components/members/MemberFormPage';
import { getMemberById } from '@/data/mockData';

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  if (!getMemberById(memberId)) {
    notFound();
  }

  return <MemberFormPage mode="edit" memberId={memberId} />;
}
