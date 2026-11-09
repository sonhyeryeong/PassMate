package com.passmate.domain.auth.google;

import org.junit.jupiter.api.Test;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertThrows;

class GoogleLoginSettingsTest {
    @Test void enabledLoginRequiresBothClientCredentials() {
        var settings = new GoogleLoginSettings(URI.create("http://localhost:3000"));
        assertThrows(IllegalArgumentException.class, () -> settings.googleRegistration("test-id", " "));
        assertThrows(IllegalArgumentException.class, () -> settings.googleRegistration("", "test-only"));
    }
}
