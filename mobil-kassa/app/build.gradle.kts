plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "uz.chorva.kassa"
    compileSdk = 34

    defaultConfig {
        applicationId = "uz.chorva.kassa"
        minSdk = 24                     // Android 7.0 va yuqorisi
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        // Imzo: debug kaliti bilan — ichki foydalanish uchun yetarli
        // (Play Store'ga chiqarilmaydi, faqat bozor xodimlari telefoniga).
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    // Ataylab MINIMAL: tashqi kutubxona yo'q — HTTP uchun HttpURLConnection,
    // JSON uchun Android ichidagi org.json. Shu tufayli APK ~1 MB va
    // qurish tez, internetdan kam narsa yuklanadi.
    implementation("androidx.appcompat:appcompat:1.7.0")
}
