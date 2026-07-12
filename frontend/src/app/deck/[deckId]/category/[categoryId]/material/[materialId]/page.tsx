import { redirect } from 'next/navigation';

export default function LegacyMaterialRedirectPage({
  params,
}: {
  params: { deckId: string; materialId: string };
}) {
  redirect(`/folder/${params.deckId}/set/${params.materialId}`);
}
