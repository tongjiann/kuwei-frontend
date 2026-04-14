<script setup lang="ts">
    import type {StockDailyInfo} from '#/stock/stock-daily-info'

















    const baseApi = '/stock/stock-daily-info'



    const {loadData, loading, model} = useDetail<StockDailyInfo>(baseApi)

    defineExpose({ init: loadData })
</script>

<template>
    <el-empty v-if="!Object.keys(model).length" v-loading="loading" />
    <el-descriptions v-else v-loading="loading" :column="2" border >
            <el-descriptions-item label="股票id" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.stockIdLabel }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="日期" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.date }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="时间" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.time }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="昨日收盘价" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.yesterdayClosePrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="开盘价" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.openPrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="今日收盘价" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.todayClosePrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="最高价" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.highPrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="最低价" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.lowPrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="成交额" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.tradingVolume }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="成交量" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.turnover }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="涨跌额" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.changePrice }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="涨跌幅" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.changePercentage }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="换手率" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.turnoverRate }}
                    </span>
            </el-descriptions-item>
            <el-descriptions-item label="量比" label-class-name="item-label" label-align="right">
                    <span class="txt-short">
                        {{ model.volumeRatio }}
                    </span>
            </el-descriptions-item>
    </el-descriptions>
</template>

<style scoped lang="scss">
    .el-descriptions {
        :deep(.el-descriptions__header) {
            margin: 0 10px 12px;
        }

            :deep(.item-label) {
                width: 120px;
            }
    }
</style>
