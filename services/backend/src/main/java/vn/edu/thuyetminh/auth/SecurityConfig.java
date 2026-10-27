package vn.edu.thuyetminh.auth;

import java.time.Clock;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import vn.edu.thuyetminh.access.AccessGrantService;
import vn.edu.thuyetminh.access.VisitorGrantAuthenticationFilter;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * Security model (see docs/architecture.md#authentication):
 * <ul>
 *   <li>Stateless HTTP: no server-side HttpSession, no auth cookies.</li>
 *   <li>Admin requests carry {@code Authorization: Bearer <opaque token>}; tokens are stored hashed in
 *       {@code auth_session} and can be revoked (real logout).</li>
 *   <li>User (UC02) requests carry {@code Authorization: Bearer <grant token>} plus {@code X-Device-Id}; the grant
 *       comes from redeeming a single-use QR, is stored hashed in {@code access_grant} and maps to
 *       {@code ROLE_VISITOR}. Users have no account.</li>
 *   <li>CSRF protection is not needed because browsers never attach the Authorization header
 *       automatically (CSRF exploits ambient credentials such as cookies). If cookies are introduced later,
 *       CSRF protection MUST be enabled.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService authService,
                                            AccessGrantService accessGrantService) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // bearer-token API without cookies; see class javadoc
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .headers(h -> h.frameOptions(f -> f.deny()))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        // UC02: only what a User needs before activation is open — language list (UC01 on the
                        // scan screen) and the QR redeem itself. Every other User API requires a valid grant.
                        .requestMatchers(HttpMethod.GET, "/api/v1/public/languages").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/public/access/redeem").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/public/**").hasRole("VISITOR")
                        // UC13/UC14 metrics: a valid grant only; identity comes from the grant, not the body.
                        .requestMatchers(HttpMethod.POST, "/api/v1/public/usage-events").hasRole("VISITOR")
                        // UC15: only Super Admin reads the audit log — before the ADMIN-only /admin rule.
                        .requestMatchers("/api/v1/admin/audit/**").hasRole("SUPER_ADMIN")
                        // UC14: analytics is shared by Admin and Super Admin.
                        .requestMatchers("/api/v1/admin/analytics/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        // UC07 + UC09: POI content and Seller management belong to ADMIN. SUPER_ADMIN must never
                        // author POI content or manage Sellers; it gets 403 here, not just a hidden UI.
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // UC13: seller reports are seller-scoped data behind the seller's own session.
                        .requestMatchers("/api/v1/seller/**").hasRole("SELLER")
                        // Account endpoints: a visitor grant is not an account, so it must not reach /auth/me.
                        .requestMatchers("/api/v1/auth/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "SELLER")
                        .requestMatchers("/error").permitAll()
                        .anyRequest().denyAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> {
                            if (req.getRequestURI().startsWith("/api/v1/public/")) {
                                JsonSecurityHandlers.write(res, ErrorCode.ACCESS_REQUIRED,
                                        "Vui lòng quét mã QR hợp lệ để sử dụng chức năng này", req.getRequestURI());
                            } else {
                                JsonSecurityHandlers.write(res, ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập",
                                        req.getRequestURI());
                            }
                        })
                        .accessDeniedHandler((req, res, ex) -> JsonSecurityHandlers.write(res,
                                ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này",
                                req.getRequestURI())))
                .addFilterBefore(new BearerTokenAuthenticationFilter(authService),
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(new VisitorGrantAuthenticationFilter(accessGrantService),
                        BearerTokenAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    /** Allowed origins come from APP_CORS_ALLOWED_ORIGINS (comma separated). Empty = no cross-origin access. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(props.cors().allowedOrigins().stream().map(String::trim)
                .filter(s -> !s.isEmpty()).toList());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Range",
                VisitorGrantAuthenticationFilter.DEVICE_HEADER));
        cfg.setExposedHeaders(List.of("Content-Disposition", "Content-Length", "Content-Range", "Accept-Ranges"));
        cfg.setAllowCredentials(false); // no cookies are used
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
