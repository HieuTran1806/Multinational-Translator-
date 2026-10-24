package vn.edu.thuyetminh.common.web;

import java.util.List;
import java.util.function.Function;

/**
 * Stable pagination envelope: framework-neutral paging carrier for the application layer and the
 * JSON shape returned to clients.
 */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public <R> PageResponse<R> map(Function<? super T, ? extends R> mapper) {
        List<R> mapped = items.stream().<R>map(mapper).toList();
        return new PageResponse<>(mapped, page, size, totalItems, totalPages);
    }
}
