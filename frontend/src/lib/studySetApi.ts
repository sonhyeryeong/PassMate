import { createCategory, getCategories } from '@/lib/categoryApi';
import { getFlashCards } from '@/lib/flashcardApi';
import { createMaterialWithCards, getMaterials } from '@/lib/materialApi';
import type { Category } from '@/types/category';
import type { FlashCard } from '@/types/flashcard';
import type { Material } from '@/types/material';

const DEFAULT_SECTION_NAME = '기본 섹션';

export type StudySet = Material & {
  cardCount?: number;
};

export interface StudySetCardInput {
  front: string;
  back: string;
}

export interface CreateStudySetRequest {
  title: string;
  description?: string;
  cards: StudySetCardInput[];
}

export async function getOrCreateDefaultSection(folderId: number): Promise<Category> {
  const categories = await getCategories(folderId);
  const defaultSection = categories[0];

  if (defaultSection) {
    return defaultSection;
  }

  return createCategory(folderId, {
    name: DEFAULT_SECTION_NAME,
    sortOrder: 0,
  });
}

export async function getStudySets(folderId: number): Promise<StudySet[]> {
  const categories = await getCategories(folderId);
  const materialGroups = await Promise.all(
    categories.map((category) => getMaterials(category.id)),
  );

  return materialGroups.flat();
}

export async function getStudySetInFolder(
  folderId: number,
  studySetId: number,
): Promise<{ category: Category; studySet: StudySet; cards: FlashCard[] }> {
  const categories = await getCategories(folderId);

  for (const category of categories) {
    const studySets = await getMaterials(category.id);
    const studySet = studySets.find((item) => item.id === studySetId);

    if (studySet) {
      const cards = await getFlashCards(studySet.id);
      return { category, studySet, cards };
    }
  }

  throw new Error('학습 세트를 찾을 수 없습니다.');
}

export async function createStudySet(
  folderId: number,
  payload: CreateStudySetRequest,
): Promise<{ studySet: StudySet; cards: FlashCard[] }> {
  const section = await getOrCreateDefaultSection(folderId);
  const response = await createMaterialWithCards(section.id, {
    title: payload.title,
    content: payload.description,
    cards: payload.cards,
  });

  return {
    studySet: response.material,
    cards: response.cards,
  };
}
