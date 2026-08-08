// 物料级校验 schema 已下沉到 @ai-design/materials,与服务端 agent 共用同一份
// (见 packages/materials/src/schemas/index.ts)。这里保留 re-export,既有引用不动。
export * from '@ai-design/materials/schemas/table'
