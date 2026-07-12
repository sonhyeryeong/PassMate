import { redirect } from 'next/navigation';

export default function LegacyDeckRedirectPage({
  params,
}: {
  params: { deckId: string };
}) {
  redirect(`/folder/${params.deckId}`);
}
