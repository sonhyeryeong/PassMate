import { redirect } from 'next/navigation';

export default function LegacyCategoryRedirectPage({
  params,
}: {
  params: { deckId: string };
}) {
  redirect(`/folder/${params.deckId}`);
}
