<template>
  <div class="home-wrapper">
    <el-card class="card">
      <div class="title">欢迎使用Kuwei系统</div>
      <div class="subtitle">Welcome Kuwei</div>

      <el-divider />

      <div class="content">
        <p>当前时间：{{ now }}</p>
        <p>系统状态：<span class="ok">正常运行</span></p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const now = ref('')

function updateTime() {
  const d = new Date()
  now.value = d.toLocaleString()
}

function refreshTime() {
  updateTime()
}

function goToDashboard() {
  router.push('/dashboard')
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.home-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f2ff, #f7f9fc);
}

.card {
  width: 420px;
  text-align: center;
  border-radius: 12px;
}

.title {
  font-size: 22px;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.content {
  font-size: 14px;
  color: #333;
}

.ok {
  color: #67c23a;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
