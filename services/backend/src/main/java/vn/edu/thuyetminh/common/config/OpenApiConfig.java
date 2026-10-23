package vn.edu.thuyetminh.common.config;

import java.util.Set;

import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    private static final String USER_API = "/api/v1/public/";
    /** User endpoints that work before a QR is redeemed (see SecurityConfig). */
    private static final Set<String> OPEN_USER_PATHS = Set.of("/api/v1/public/languages", "/api/v1/public/access/redeem");

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info().title("Thuyết minh đa ngôn ngữ API").version("v1")
                        .description("REST API cho ứng dụng thuyết minh (MVP). Lỗi trả về dạng ApiError thống nhất."))
                .components(new Components()
                        .addSecuritySchemes("bearer", new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")
                                .description("Admin: token từ POST /api/v1/auth/login. "
                                        + "User: accessToken từ POST /api/v1/public/access/redeem"))
                        .addSecuritySchemes("device", new SecurityScheme().type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER).name("X-Device-Id")
                                .description("User (UC02): đúng deviceId đã gửi khi redeem QR")));
    }

    /** Marks every User endpoint that needs a grant, so Swagger UI sends both the token and X-Device-Id. */
    @Bean
    OpenApiCustomizer visitorGrantSecurity() {
        return api -> api.getPaths().forEach((path, item) -> {
            if (path.startsWith(USER_API) && !OPEN_USER_PATHS.contains(path)) {
                item.readOperations().forEach(op -> op.setSecurity(java.util.List.of(
                        new SecurityRequirement().addList("bearer").addList("device"))));
            }
        });
    }
}
