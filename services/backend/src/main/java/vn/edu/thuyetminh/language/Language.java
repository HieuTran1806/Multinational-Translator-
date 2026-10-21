package vn.edu.thuyetminh.language;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "language")
public class Language {

    @Id
    @Column(length = 10)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "native_name", nullable = false, length = 60)
    private String nativeName;

    @Column(name = "tts_language_code", nullable = false, length = 20)
    private String ttsLanguageCode;

    @Column(name = "default_tts_voice", length = 80)
    private String defaultTtsVoice;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected Language() {
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getNativeName() {
        return nativeName;
    }

    public String getTtsLanguageCode() {
        return ttsLanguageCode;
    }

    public String getDefaultTtsVoice() {
        return defaultTtsVoice;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
