import type { PageDesignResult } from './input.js'
import type { PageDesignGraphState } from './state.js'

export function toPageDesignResult(state: PageDesignGraphState): PageDesignResult {
  const ok = state.previewPage !== undefined && state.errors.length === 0
  return {
    ok,
    summary: state.proposal?.summary ?? '',
    operations: state.proposal?.operations ?? [],
    ...(state.previewPage ? { previewPage: state.previewPage } : {}),
    errors: state.errors,
  }
}
