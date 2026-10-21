package vn.edu.thuyetminh.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info().title("Thuyết minh đa ngôn ngữ API").version("v1")
                        .description("REST API cho ứng dụng thuyết minh (MVP). Lỗi trả về dạng ApiError thống nhất."))
                .components(new Components().addSecuritySchemes("bearer",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")
                                .description("Token nhận từ POST /api/v1/auth/login")));
    }
}
