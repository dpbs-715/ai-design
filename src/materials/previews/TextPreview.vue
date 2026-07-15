<script setup lang="ts">
defineOptions({ name: 'TextMaterialPreview' })
</script>

<template>
  <div class="text-preview" aria-hidden="true">
    <span class="type-mark">
      <strong>Aa</strong>
      <small>TYPE</small>
    </span>
    <span class="sample-copy">
      <strong>文本信息</strong>
      <small>清晰表达每一个重点</small>
    </span>
  </div>
</template>

<style scoped lang="scss">
.text-preview {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
}

.type-mark {
  display: flex;
  width: 42px;
  height: 36px;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--accent-color) 48%, var(--border-color));
  border-radius: 8px 3px 8px 3px;
  background: var(--accent-soft);
  color: var(--accent-color);

  strong {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.06em;
    line-height: 0.9;
  }

  small {
    margin-top: 4px;
    font-size: 6px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
}

.sample-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  small {
    color: var(--text-muted);
    font-size: 9px;
    letter-spacing: 0.06em;
  }
}
</style>
