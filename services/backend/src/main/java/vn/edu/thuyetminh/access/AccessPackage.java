package vn.edu.thuyetminh.access;

import java.time.Duration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A sellable access package. The grant duration lives in data so new packages need no code change. */
@Entity
@Table(name = "access_package")
public class AccessPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private boolean active;

    protected AccessPackage() {
    }

    public AccessPackage(String code, String name, int durationMinutes) {
        this.code = code;
        this.name = name;
        this.durationMinutes = durationMinutes;
        this.active = true;
    }

    public Duration duration() {
        return Duration.ofMinutes(durationMinutes);
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public boolean isActive() {
        return active;
    }
}
