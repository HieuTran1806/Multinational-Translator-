package vn.edu.thuyetminh.architecture;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/** Lightweight architecture fitness checks that require no extra test dependency. */
class CleanArchitectureBoundaryTest {

    private static final Path SOURCE_ROOT = Path.of("src/main/java/vn/edu/thuyetminh");

    @Test
    void applicationServicesAndHttpControllersMustNotDependOnSpringDataOrRepositories() throws IOException {
        List<Path> violations;
        try (Stream<Path> files = Files.walk(SOURCE_ROOT)) {
            violations = files.filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith("Service.java")
                            || path.toString().endsWith("Controller.java"))
                    .filter(CleanArchitectureBoundaryTest::importsSpringDataOrRepository)
                    .toList();
        }

        assertThat(violations)
                .as("Application services and HTTP controllers must use application ports, not Spring Data")
                .isEmpty();
    }

    @Test
    void springDataRepositoryImportsMustStayInRepositoryDefinitionsOrPersistenceAdapters() throws IOException {
        List<Path> violations;
        try (Stream<Path> files = Files.walk(SOURCE_ROOT)) {
            violations = files.filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".java"))
                    .filter(path -> !path.toString().endsWith("Repository.java")
                            && !path.toString().contains(java.io.File.separator + "persistence"
                                    + java.io.File.separator))
                    .filter(CleanArchitectureBoundaryTest::importsSpringDataOrRepository)
                    .toList();
        }

        assertThat(violations)
                .as("Spring Data types must be confined to repository definitions and persistence adapters")
                .isEmpty();
    }

    private static boolean importsSpringDataOrRepository(Path path) {
        try {
            return Files.readString(path).lines().anyMatch(line ->
                    line.contains("org.springframework.data")
                            || line.matches("\\s*import\\s+[^;]*Repository\\s*;"));
        } catch (IOException e) {
            throw new IllegalStateException("Cannot inspect architecture source: " + path, e);
        }
    }
}