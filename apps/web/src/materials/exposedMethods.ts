import type {
  BusinessFormMethodName,
  ChartMethodName,
  DataTableMethodName,
  DialogMethodName,
  FormItemMethodName,
} from '@ai-design/materials'
import type { BusinessFormExpose } from '@/materials/business-form/runtime.vue'
import type { FormItemControlExpose } from '@/materials/business-form/FormItemControl.vue'
import type { ChartMaterialExpose } from '@/materials/charts/component.vue'
import type { DialogMaterialExpose } from '@/materials/dialog/component.vue'
import type { DataTableMaterialExpose } from '@/materials/table/component.vue'

/**
 * 把描述符里的 `exposedMethods` 数据与各物料 `defineExpose` 的实际类型钉在一起。
 *
 * 描述符的方法清单是给 agent 和编辑器看的「有哪些方法可调」;真正的签名仍在
 * .vue 的 Expose interface 里(它们依赖 useConfigs / TableRow 等 web 内部类型,
 * 搬不进 materials 包)。两份东西各有存在理由,但方法名必须一致 ——
 * 往 defineExpose 加了方法却忘了登记进描述符,agent 就永远不知道它存在;
 * 反过来登记了不存在的方法,模型生成的 trigger 调用会静默失败。
 *
 * 下面的断言让这两种情况都变成编译错误,错误信息直接指出多了/少了哪个名字。
 * 本文件只有类型,没有运行时产物。
 */

/** A 有、B 没有的键。 */
type MissingKeys<A extends string, B extends string> = Exclude<A, B>

/**
 * 把结果钉成 `true`。
 *
 * 这一层是断言真正生效的地方 —— 少了它,下面的 `type _XxxLock = ...` 只是声明
 * 一个类型别名,算出错误对象也没人检查。约束写在类型参数上,不一致时报在
 * 具体那一行,错误信息里带上缺失的方法名。
 */
type Assert<T extends true> = T

/**
 * 断言两组方法名完全一致。
 *
 * 用法:`type _Lock = Assert<SameMethods<描述符名字, Expose 接口键>>`。
 *
 * 两侧都用 `[T] extends [never]` 而不是 `T extends never` —— 后者是分布式
 * 条件类型,`never` 作为空联合分布后整个表达式求值成 `never`,连一致的情况
 * 都算不出 `true`。
 */
type SameMethods<Declared extends string, Actual extends string> = [
  MissingKeys<Actual, Declared>,
] extends [never]
  ? [MissingKeys<Declared, Actual>] extends [never]
    ? true
    : Fail<`描述符登记了但 defineExpose 没实现: ${MissingKeys<Declared, Actual>}`>
  : Fail<`defineExpose 暴露了但描述符没登记: ${MissingKeys<Actual, Declared>}`>

/**
 * 故意不是 `true`,从而违反 `Assert` 的约束触发编译错误;
 * 错误文本会把缺失的方法名一并打出来。
 */
type Fail<Message extends string> = { readonly __methodMismatch: Message }

// 每一行:描述符登记的名字 ⟷ defineExpose 实际暴露的键。
type _DialogLock = Assert<SameMethods<DialogMethodName, keyof DialogMaterialExpose>>
type _ChartLock = Assert<SameMethods<ChartMethodName, keyof ChartMaterialExpose>>
type _FormItemLock = Assert<SameMethods<FormItemMethodName, keyof FormItemControlExpose>>
type _BusinessFormLock = Assert<SameMethods<BusinessFormMethodName, keyof BusinessFormExpose>>
type _DataTableLock = Assert<SameMethods<DataTableMethodName, keyof DataTableMaterialExpose>>

export type {
  _BusinessFormLock,
  _ChartLock,
  _DataTableLock,
  _DialogLock,
  _FormItemLock,
}
