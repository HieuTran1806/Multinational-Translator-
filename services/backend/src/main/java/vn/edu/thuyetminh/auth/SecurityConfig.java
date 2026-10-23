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

import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * Security model (see docs/architecture.md#authentication):
 * <ul>
 *   <li>Stateless HTTP: no server-side HttpSession, no auth cookies.</li>
 *   <li>Admin requests carry {@code Authorization: Bearer <opaque token>}; tokens are stored hashed in
 *       {@code auth_session} and can be revoked (real logout).</li>
 *   <li>CSRF protection is not needed because browsers never attach the Authorization header
 *       automatically (CSRF exploits ambient credentials such as cookies). If cookies are introduced later,
 *       CSRF protection MUST be enabled.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService authService) throws Exception {
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
                        .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                        // UC07: POI/content/media management belongs to ADMIN. SUPER_ADMIN manages accounts/RBAC/audit
                        // (not implemented yet) and must never author POI content; it gets 403 here, not just a hidden UI.
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/auth/**").authenticated()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().denyAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> JsonSecurityHandlers.write(res,
                                ErrorCode.UNAUTHENTICATED, "Bạn cần đăng nhập", req.getRequestURI()))
                        .accessDeniedHandler((req, res, ex) -> JsonSecurityHandlers.write(res,
                                ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này",
                                req.getRequestURI())))
                .addFilterBefore(new BearerTokenAuthenticationFilter(authService),
                        UsernamePasswordAuthenticationFilter.class);
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
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Range"));
        cfg.setExposedHeaders(List.of("Content-Disposition", "Content-Length", "Content-Range", "Accept-Ranges"));
        cfg.setAllowCredentials(false); // no cookies are used
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
