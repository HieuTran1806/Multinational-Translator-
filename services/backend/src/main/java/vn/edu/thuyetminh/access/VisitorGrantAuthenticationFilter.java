package vn.edu.thuyetminh.access;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * For User endpoints ({@code /api/v1/public/**}): reads {@code Authorization: Bearer <grant token>} plus
 * {@code X-Device-Id} and, when the grant is valid for that device, authenticates the request as
 * {@code ROLE_VISITOR}. Never logs either value.
 */
public class VisitorGrantAuthenticationFilter extends OncePerRequestFilter {

    public static final String DEVICE_HEADER = "X-Device-Id";
    private static final String PREFIX = "Bearer ";
    private static final String USER_API = "/api/v1/public/";

    private final AccessGrantService grants;

    public VisitorGrantAuthenticationFilter(AccessGrantService grants) {
        this.grants = grants;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(USER_API);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (SecurityContextHolder.getContext().getAuthentication() == null
                && header != null && header.regionMatches(true, 0, PREFIX, 0, PREFIX.length())) {
            String token = header.substring(PREFIX.length()).trim();
            grants.authenticate(token, request.getHeader(DEVICE_HEADER)).ifPresent(visitor -> {
                var auth = new UsernamePasswordAuthenticationToken(visitor, null,
                        List.of(new SimpleGrantedAuthority("ROLE_VISITOR")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(request, response);
    }
}
