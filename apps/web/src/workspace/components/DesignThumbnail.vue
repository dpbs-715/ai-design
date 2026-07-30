<script setup lang="ts">
import type { ThumbnailVariant } from '../types.ts'

defineOptions({ name: 'DesignThumbnail' })

const { variant = 'overview', compact = false } = defineProps<{
  variant?: ThumbnailVariant
  compact?: boolean
}>()
</script>

<template>
  <div class="design-thumbnail" :class="[`is-${variant}`, { 'is-compact': compact }]">
    <div class="thumbnail-topline">
      <span></span>
      <i></i>
    </div>
    <div class="thumbnail-grid">
      <div class="thumbnail-hero">
        <div class="hero-copy">
          <span></span>
          <strong></strong>
        </div>
        <div class="hero-chart">
          <i v-for="index in 7" :key="index"></i>
        </div>
      </div>
      <div class="thumbnail-side">
        <span v-for="index in 3" :key="index">
          <i></i>
          <b></b>
        </span>
      </div>
      <div class="thumbnail-bottom">
        <i v-for="index in 5" :key="index"></i>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.design-thumbnail {
  --preview-accent: #6e83a6;
  --preview-accent-soft: #cad4e3;
  --preview-base: #16202d;
  --preview-panel: #202d3c;

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 30% 0%,
      color-mix(in srgb, var(--preview-accent) 26%, transparent),
      transparent 38%
    ),
    var(--preview-base);
  color: var(--preview-accent);
}

.is-park {
  --preview-accent: #83ad9b;
  --preview-accent-soft: #c8ddd4;
  --preview-base: #162624;
  --preview-panel: #203634;
}

.is-energy {
  --preview-accent: #c4a965;
  --preview-accent-soft: #e2d6b8;
  --preview-base: #252319;
  --preview-panel: #353123;
}

.is-equipment {
  --preview-accent: #8b88b3;
  --preview-accent-soft: #d1cfe0;
  --preview-base: #1c1b29;
  --preview-panel: #29273a;
}

.is-logistics {
  --preview-accent: #ae8277;
  --preview-accent-soft: #dfc9c3;
  --preview-base: #281e1d;
  --preview-panel: #392a28;
}

.is-overview {
  --preview-accent: #7995a0;
  --preview-accent-soft: #c9d8dd;
  --preview-base: #182327;
  --preview-panel: #223238;
}

.thumbnail-topline {
  display: flex;
  height: 18%;
  align-items: center;
  justify-content: space-between;
  padding: 0 7%;
  border-bottom: 1px solid color-mix(in srgb, var(--preview-accent) 28%, transparent);

  span {
    width: 30%;
    height: 12%;
    border-radius: 99px;
    background: var(--preview-accent-soft);
  }

  i {
    width: 5%;
    aspect-ratio: 1;
    border: 1px solid var(--preview-accent);
    border-radius: 50%;
  }
}

.thumbnail-grid {
  display: grid;
  height: 82%;
  grid-template-columns: 1.55fr 0.7fr;
  grid-template-rows: 1fr 0.28fr;
  gap: 5%;
  padding: 6%;
}

.thumbnail-hero,
.thumbnail-side,
.thumbnail-bottom {
  border: 1px solid color-mix(in srgb, var(--preview-accent) 24%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--preview-panel) 84%, transparent);
}

.thumbnail-hero {
  display: flex;
  flex-direction: column;
  padding: 8%;
}

.hero-copy {
  display: flex;
  align-items: flex-end;
  gap: 8%;

  span {
    width: 24%;
    height: 3px;
    background: var(--preview-accent-soft);
  }

  strong {
    width: 38%;
    height: 6px;
    border-radius: 4px;
    background: var(--preview-accent);
  }
}

.hero-chart {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 12%;
  border-bottom: 1px solid color-mix(in srgb, var(--preview-accent) 26%, transparent);

  i {
    width: 8%;
    min-height: 14%;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(to top, transparent, var(--preview-accent));

    @for $index from 1 through 7 {
      &:nth-child(#{$index}) {
        height: #{24 + (($index * 17) % 58)}%;
      }
    }
  }
}

.thumbnail-side {
  display: grid;
  gap: 8%;
  padding: 12%;

  span {
    display: flex;
    min-height: 0;
    align-items: center;
    gap: 12%;
    padding: 0 10%;
    border-radius: 2px;
    background: color-mix(in srgb, var(--preview-accent) 8%, transparent);
  }

  i {
    width: 18%;
    aspect-ratio: 1;
    border: 1px solid var(--preview-accent);
    border-radius: 50%;
  }

  b {
    width: 52%;
    height: 3px;
    background: color-mix(in srgb, var(--preview-accent-soft) 75%, transparent);
  }
}

.thumbnail-bottom {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-around;
  padding: 0 4%;

  i {
    width: 14%;
    height: 18%;
    border-radius: 99px;
    background: color-mix(in srgb, var(--preview-accent) 60%, transparent);
  }
}

.is-compact {
  .thumbnail-topline {
    height: 20%;
  }

  .thumbnail-grid {
    height: 80%;
    gap: 4%;
    padding: 5%;
  }
}
</style>
