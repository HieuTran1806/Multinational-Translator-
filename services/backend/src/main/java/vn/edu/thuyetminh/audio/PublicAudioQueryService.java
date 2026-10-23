package vn.edu.thuyetminh.audio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.poi.PoiTranslation;
import vn.edu.thuyetminh.poi.PoiTranslationStore;

/** Application use case that exposes only current audio belonging to a published POI. */
@Service
public class PublicAudioQueryService {
    private final AudioAssetStore assets;
    private final PoiTranslationStore translations;

    public PublicAudioQueryService(AudioAssetStore assets, PoiTranslationStore translations) {
        this.assets = assets;
        this.translations = translations;
    }

    @Transactional(readOnly = true)
    public AudioAsset requirePublicAudio(Long assetId) {
        AudioAsset asset = assets.findById(assetId).orElseThrow(() -> ApiException.notFound("Audio"));
        PoiTranslation translation = translations.findById(asset.getTranslationId())
                .orElseThrow(() -> ApiException.notFound("Audio"));
        if (asset.getStatus() != AudioAssetStatus.READY
                || asset.getContentVersion() != translation.getContentVersion()
                || !translation.getPoi().isPublished()) {
            throw ApiException.notFound("Audio");
        }
        return asset;
    }
}