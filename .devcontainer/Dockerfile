# Imagen de desarrollo para Telecom Q&A — Theia / cualquier devcontainer
#
# Incluye Node.js, JDK 17 y el Android SDK (solo command-line tools, sin
# Android Studio) ya instalados y con las licencias aceptadas, para que
# `npx cap add android` + `./gradlew assembleDebug` funcionen apenas se
# abre el workspace, sin pasos manuales de instalación.

FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# --- JDK 17 (requerido por el Android Gradle Plugin) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        openjdk-17-jdk-headless \
        unzip \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# --- Android SDK: solo command-line tools ---
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools

# Versión de las command-line tools. Revisa la última en:
# https://developer.android.com/studio#command-line-tools-only
ARG CMDLINE_TOOLS_VERSION=11076708

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools \
    && curl -fsSL -o /tmp/cmdline-tools.zip \
        "https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip" \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools \
    && mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip

# Acepta licencias e instala plataforma + build-tools + platform-tools.
# Ajusta la versión de plataforma/build-tools si tu proyecto lo requiere.
RUN yes | sdkmanager --licenses > /dev/null \
    && sdkmanager --install \
        "platform-tools" \
        "platforms;android-34" \
        "build-tools;34.0.0" \
    > /dev/null

WORKDIR /workspace
