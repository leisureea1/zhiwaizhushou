<template>
	<view class="page">
		<!-- 头部 -->
		<view class="header">
			<view class="header-content" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="back-btn" @tap="handleBack">
					<text class="iconfont icon-navigate_before"></text>
				</view>
				<text class="header-title">更新教务系统密码</text>
				<view class="header-right"></view>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="content">
			<view class="info-box">
				<view class="info-icon">
					<text class="iconfont icon-arrow_forward"></text>
				</view>
				<text class="info-text">如果您的教务系统密码已更改，请在此处提交最新密码，以便继续使用成绩查询、考试安排等功能。</text>
			</view>

			<view class="form-section">
				<view class="input-wrapper">
					<view class="input-label">学号</view>
					<input 
						class="input-field" 
						type="text" 
						v-model="username"
						placeholder="请输入学号" 
						placeholder-class="placeholder"
						disabled
					/>
				</view>

				<view class="input-wrapper">
					<view class="input-label">新教务系统密码</view>
					<input 
						class="input-field" 
						type="text"
						:password="!showPassword"
						v-model="password"
						placeholder="请输入最新的教务系统密码" 
						placeholder-class="placeholder"
					/>
					<view class="toggle-password" @tap="showPassword = !showPassword">
						<text class="iconfont" :class="showPassword ? 'icon-visibility' : 'icon-visibility_off'"></text>
					</view>
				</view>

				<view class="tip-text">
					<text class="iconfont icon-info"></text>
					<text>请输入教务系统（jwxt.xisu.edu.cn）的最新登录密码</text>
				</view>
			</view>

			<button class="btn-primary" :disabled="isLoading" @tap="handleSubmit">
				{{ isLoading ? '提交中...' : '更新密码' }}
			</button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { safeNavigateBack } from '@/utils/navigation';
import { jwxtApi, getUserInfo } from '@/services/apiService';

const statusBarHeight = ref(0);
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

onMounted(() => {
	const systemInfo = uni.getSystemInfoSync();
	statusBarHeight.value = systemInfo.statusBarHeight || 0;
	
	// 预填充学号
	const userInfo = getUserInfo<{ studentId?: string }>();
	if (userInfo?.studentId) {
		username.value = userInfo.studentId;
	}
});

const handleBack = () => {
	safeNavigateBack();
};

const handleSubmit = async () => {
	if (!username.value) {
		uni.showToast({ title: '请输入学号', icon: 'none' });
		return;
	}
	if (!password.value) {
		uni.showToast({ title: '请输入新密码', icon: 'none' });
		return;
	}

	isLoading.value = true;
	uni.showLoading({ title: '验证中...' });

	try {
		await jwxtApi.bindAccount(username.value, password.value);
		uni.hideLoading();
		uni.showToast({ title: '教务密码更新成功', icon: 'success' });
		setTimeout(() => {
			safeNavigateBack();
		}, 1500);
	} catch (error) {
		uni.hideLoading();
		const errorMsg = error instanceof Error ? error.message : '更新失败，请检查密码是否正确';
		uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 });
	} finally {
		isLoading.value = false;
	}
};
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-light;
}

.header {
	background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
}

.header-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	padding-bottom: 20px;
}

.back-btn {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;

	.iconfont {
		font-size: 28px;
		color: #fff;
	}
}

.header-title {
	font-size: 18px;
	font-weight: 600;
	color: #fff;
}

.header-right {
	width: 40px;
}

.content {
	padding: 20px;
}

.info-box {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	background: #fff;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-icon {
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	.iconfont {
		font-size: 24px;
		color: #fff;
	}
}

.info-text {
	flex: 1;
	font-size: 14px;
	color: #666;
	line-height: 1.6;
}

.form-section {
	background: #fff;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 24px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
	position: relative;
	margin-bottom: 16px;

	&:last-of-type {
		margin-bottom: 0;
	}
}

.input-label {
	font-size: 14px;
	color: #333;
	font-weight: 500;
	margin-bottom: 8px;
}

.input-field {
	width: 100%;
	height: 48px;
	background: #f5f5f5;
	border-radius: 8px;
	padding: 0 16px;
	font-size: 15px;
	box-sizing: border-box;
}

.placeholder {
	color: #999;
}

.toggle-password {
	position: absolute;
	right: 12px;
	bottom: 12px;

	.iconfont {
		font-size: 20px;
		color: #999;
	}
}

.tip-text {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px dashed #eee;
	
	.iconfont {
		font-size: 14px;
		color: #999;
	}
	
	text {
		font-size: 12px;
		color: #999;
	}
}

.btn-primary {
	width: 100%;
	height: 48px;
	background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
	border-radius: 24px;
	border: none;
	color: #fff;
	font-size: 16px;
	font-weight: 600;

	&[disabled] {
		opacity: 0.6;
	}
}
</style>
