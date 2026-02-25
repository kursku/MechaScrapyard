<template>
    <div class="hud-overlay">
        <!-- Digital Noise/Static Layer -->
        <div class="noise"></div>
        <!-- Scanning Line -->
        <div class="scanline"></div>
        <!-- Corner Brackets for HUD feel -->
        <div class="hud-corner top-left"></div>
        <div class="hud-corner top-right"></div>
        <div class="hud-corner bottom-left"></div>
        <div class="hud-corner bottom-right"></div>
    </div>
</template>

<style scoped>
.hud-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
}

.noise {
    position: absolute;
    inset: 0;
    background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl93yXAAAACHRSTlMA7v6v/r7+f92RHgAAADhJREFUKM9jYEAADijAAEQwwAAYYIABECCAAQYYAAEYGAAKAggYAAoCCBgACgIIGAAKAggYAAYIAD7nAWuL0VphAAAAAElFTkSuQmCC');
    opacity: 0.03;
    z-index: 1;
}

.scanline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 255, 65, 0.03) 50%,
        transparent 100%
    );
    background-size: 100% 4px;
    z-index: 5;
    animation: scanTask 8s linear infinite;
}

@keyframes scanTask {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}

.hud-corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary);
    opacity: 0.3;
}

.top-left { top: 20px; left: 20px; border-right: 0; border-bottom: 0; }
.top-right { top: 20px; right: 20px; border-left: 0; border-bottom: 0; }
.bottom-left { bottom: 20px; left: 20px; border-right: 0; border-top: 0; }
.bottom-right { bottom: 20px; right: 20px; border-left: 0; border-top: 0; }

@media (prefers-reduced-motion: reduce) {
    .scanline {
        animation: none;
        display: none;
    }

    .noise {
        opacity: 0.01;
    }

    .hud-corner {
        opacity: 0.15;
    }
}
</style>
