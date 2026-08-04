package com.passmate.domain.review.service;

import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;

    @Mock
    private FlashCardRepository flashCardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void rejectsHistoryRequestForMissingUser() {
        when(userRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reviewService.getUserReviewHistory(99L)
        );

        assertEquals("USER_NOT_FOUND", exception.getCode());
        verify(reviewHistoryRepository, never()).findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        );
    }

    @Test
    void limitsRecentHistoryToOneHundredItems() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(reviewHistoryRepository.findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        )).thenReturn(List.of());

        reviewService.getUserReviewHistory(1L);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reviewHistoryRepository).findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.eq(1L),
                pageableCaptor.capture()
        );
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(100, pageableCaptor.getValue().getPageSize());
    }
}
