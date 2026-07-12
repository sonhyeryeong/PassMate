import { createDeck, getDeck, getDecks } from '@/lib/deckApi';
import type { CreateDeckRequest, Deck } from '@/types/deck';

export type Folder = Deck;
export type CreateFolderRequest = CreateDeckRequest;

export async function getFolders(userId: number): Promise<Folder[]> {
  return getDecks(userId);
}

export async function getFolder(folderId: number, userId: number): Promise<Folder> {
  return getDeck(folderId, userId);
}

export async function createFolder(
  userId: number,
  payload: CreateFolderRequest,
): Promise<Folder> {
  return createDeck(userId, payload);
}
