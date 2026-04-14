<template>
  <div style="padding: 20px">
    <el-card>
      <h3>API 调试工具</h3>

      <!-- API地址 -->
      <el-input
        v-model="apiUrl"
        placeholder="请输入接口地址，例如 /stock/common/sync-daily-info"
        style="margin-bottom: 10px"
      />

      <!-- 请求方式 -->
      <el-select v-model="method" style="width: 120px; margin-bottom: 10px">
        <el-option label="GET" value="get" />
        <el-option label="POST" value="post" />
      </el-select>

      <!-- 参数 -->
      <el-input
        v-model="params"
        type="textarea"
        :rows="5"
        placeholder='请输入JSON参数，例如 {"code":"600519"}'
        style="margin-bottom: 10px"
      />

      <!-- 按钮 -->
      <el-button type="primary" :loading="loading" @click="sendRequest"> 发送请求 </el-button>

      <!-- 返回结果 -->
      <el-divider />

      <el-input v-model="response" type="textarea" :rows="15" readonly placeholder="返回结果" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/request'

const apiUrl = ref('')
const method = ref<'get' | 'post'>('get')
const params = ref('')
const response = ref('')
const loading = ref(false)

const sendRequest = async () => {
  if (!apiUrl.value) {
    ElMessage.warning('请输入API地址')
    return
  }

  let parsedParams = {}

  try {
    parsedParams = params.value ? JSON.parse(params.value) : {}
  } catch (e) {
    ElMessage.error('参数必须是合法JSON')
    return
  }

  loading.value = true
  response.value = ''

  try {
    let res

    if (method.value === 'get') {
      res = await api.get(apiUrl.value, parsedParams)
    } else {
      res = await api.post(apiUrl.value, parsedParams)
    }

    response.value = JSON.stringify(res, null, 2)
  } catch (err: any) {
    response.value = JSON.stringify(err, null, 2)
  } finally {
    loading.value = false
  }
}
</script>
