package vn.edu.thuyetminh.poi.persistence;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/** Validates paging parameters at the persistence adapter boundary. */
final class PageRequests {
    private static final int MAX_SIZE = 100;

    private PageRequests() {
    }

    static PageRequest of(int page, int size, Sort sort) {
        if (page < 0 || size < 1 || size > MAX_SIZE) {
            throw new ApiException(ErrorCode.BAD_REQUEST,
                    "page phải >= 0 và size trong khoảng 1.." + MAX_SIZE);
        }
        return PageRequest.of(page, size, sort);
    }
}