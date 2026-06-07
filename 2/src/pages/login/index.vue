<template>
  <h1>用户登录</h1>
  <van-form @submit="onSubmit">
    <van-cell-group inset>
      <van-field
        v-model="form.userName"
        name="用户名"
        label="手机号"
        placeholder="请输入手机号"
        autocomplete="username"
        :rules="[{ required: true, message: '请输入手机号' }, { validator: validateUser, message: '手机号格式不正确' }]"
      />
      <van-field
        v-model="form.passWord"
        type="password"
        name="密码"
        label="密码"
        placeholder="请输入密码"
        autocomplete="current-password"
        :rules="[{ required: true, message: '请输入密码' }, { validator: validatePass, message: '密码格式不对，需要4-16位字母/数字/下划线/减号' }]"
      />
      <van-field
        v-if="formType === 1"
        v-model="form.validCode"
        name="验证码"
        label="验证码"
        placeholder="请输入验证码"
        autocomplete="one-time-code"
        :rules="[{ required: true, message: '请输入验证码' }]"
      >
        <template #button>
          <van-button
            size="small"
            type="primary"
            :disabled="sending"
            @click.prevent="sendCode"
          >
            {{ countdown.validText }}
          </van-button>
        </template>
      </van-field>
    </van-cell-group>
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit" :loading="loading">
        {{ formType === 1 ? '注册账号' : '登录' }}
      </van-button>
    </div>
  </van-form>
  <div style="text-align: center; margin-top: 8px">
    <span
      style="color: #1989fa; text-decoration: underline; cursor: pointer"
      @click="handleChange"
    >
      {{ formType === 1 ? '返回登录' : '注册账号' }}
    </span>
  </div>
</template>

<script setup >

import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showNotify } from "vant";
import api from "../../api/api";

const router = useRouter();

const loading = ref(false);
const sending = ref(false);
// 0 = 登录，1 = 注册
const formType = ref(0);

const form = reactive({
  userName: "",
  passWord: "",
  validCode: "",
});

const countdown = reactive({
  validText: "获取验证码",
  time: 60,
});
let countdownTimer = null;

const phoneReg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
const passReg = /^[a-zA-Z0-9_-]{4,16}$/;

function validateUser(rule, value, callback) {
  const val = typeof value === "string" ? value : (rule && typeof rule === "string" ? rule : "");
  if (!val) {
    return typeof callback === "function" ? callback() : true;
  }
  const ok = phoneReg.test(val);
  if (typeof callback === "function") {
    return ok ? callback() : callback(new Error("手机号格式不正确"));
  }
  return ok ? true : "手机号格式不正确";
}
function validatePass(rule, value, callback) {
  const val = typeof value === "string" ? value : (rule && typeof rule === "string" ? rule : "");
  if (!val) {
    return typeof callback === "function" ? callback() : true;
  }
  const ok = passReg.test(val);
  if (typeof callback === "function") {
    return ok ? callback() : callback(new Error("密码格式不对"));
  }
  return ok ? true : "密码格式不对，需要4-16位字母/数字/下划线/减号";
}

function handleChange() {
  formType.value = formType.value === 1 ? 0 : 1;
  form.validCode = "";
  resetCountdown();
}

function resetCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.time = 60;
  countdown.validText = "获取验证码";
}

async function sendCode() {
  if (!form.userName || !phoneReg.test(form.userName)) {
    return showNotify({ type: "warning", message: "请输入正确的手机号" });
  }
  try {
    sending.value = true;
    await api.getCode({ tel: form.userName });
    showNotify({ type: "success", message: "验证码已发送" });
    // 60 秒倒计时
    countdown.time = 60;
    countdown.validText = `剩余${countdown.time}s`;
    countdownTimer = setInterval(() => {
      if (countdown.time <= 0) {
        resetCountdown();
      } else {
        countdown.time -= 1;
        countdown.validText = `剩余${countdown.time}s`;
      }
    }, 1000);
  } catch (err) {
    console.error("获取验证码失败:", err);
    const message = typeof err === "string" ? err : "验证码发送失败，请稍后重试";
    showNotify({ type: "danger", message });
  } finally {
    sending.value = false;
  }
}

async function onSubmit() {
  try {
    loading.value = true;
    if (formType.value === 1) {
      // 注册
      await api.authentication(form);
      showNotify({ type: "success", message: "注册成功！请登录" });
      formType.value = 0;
      form.validCode = "";
      resetCountdown();
    } else {
      // 登录
      const res = await api.login(form);
      if (res && res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userInfo", JSON.stringify(res.userInfo));
        showNotify({ type: "success", message: "登录成功" });
        setTimeout(() => router.push("/home"), 300);
      } else {
        showNotify({ type: "danger", message: "登录信息异常，请重试" });
      }
    }
  } catch (err) {
    console.error("操作失败:", err);
    const message = typeof err === "string" ? err : "操作失败，请稍后重试";
    showNotify({ type: "danger", message });
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
h1 {
  text-align: center;
  margin-top: 40px;
}
</style>
