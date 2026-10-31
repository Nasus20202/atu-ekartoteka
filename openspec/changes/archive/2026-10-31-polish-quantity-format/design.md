# Design

`formatQuantity(quantity: DecimalLike)` in `src/lib/utils/index.ts` converts the value with `toDecimal(...).toString()` and replaces the decimal point with a comma. It does not use `Intl.NumberFormat`, which would cap the fraction digits and lose the exact imported value. The four views that printed raw quantities call it.
