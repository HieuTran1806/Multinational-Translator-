package vn.edu.thuyetminh.common.web;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/** Stable pagination envelope (independent of Spring Data's internal JSON shape). */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
