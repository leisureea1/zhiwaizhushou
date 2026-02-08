<template>
	<view class="page">
		<!-- 头部 -->
		<view class="header">
			<view class="header-content" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="back-btn" @tap="handleBack">
					<text class="iconfont icon-navigate_before"></text>
				</view>
				<text class="header-title">修改知外助手密码</text>
				<view class="header-right"></view>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="content">
			<view class="info-box">
				<view class="info-icon">
					<text class="iconfont icon-flight_class"></text>
				</view>
				<text class="info-text">修改知外助手的登录密码。修改成功后需要重新登录。</text>
			</view>

			<view class="form-section">
				<view class="input-wrapper">
					<view class="input-label">当前密码</view>
					<input 
						class="input-field" 
						type="text"
						:password="!showOldPassword"
						v-model="oldPassword"
						placeholder="请输入当前密码" 
						placeholder-class="placeholder"
					/>
					<view class="toggle-password" @tap="showOldPassword = !showOldPassword">
						<text class="iconfont" :class="showOldPassword ? 'icon-visibility' : 'icon-visibility_off'"></text>
					</view>
				</view>

				<view class="input-wrapper">
					<view class="input-label">新密码</view>
					<input 
						class="input-field" 
						type="text"
						:password="!showNewPassword"
						v-model="newPassword"
						placeholder="请输入新密码（至少6位）" 
						placeholder-class="placeholder"
					/>
					<view class="toggle-password" @tap="showNewPassword = !showNewPassword">
						<text class="iconfont" :class="showNewPassword ? 'icon-visibility' : 'icon-visibility_off'"></text>
					</view>
				</view>

				<view class="input-wrapper">
					<view class="input-label">确认新密码</view>
					<input 
						class="input-field" 
						type="text"
						:password="!showConfirmPassword"
						v-model="confirmPassword"
						placeholder="请再次输入新密码" 
						placeholder-class="placeholder"
					/>
					<view class="toggle-password" @tap="showConfirmPassword = !showConfirmPassword">
						<text class="iconfont" :class="showConfirmPassword ? 'icon-visibility' : 'icon-visibility_off'"></text>
					</view>
				</view>

				<view class="tip-text">
					<text class="iconfont icon-info"></text>
					<text>密码修改成功后，所有设备将自动退出登录</text>
				</view>
			</view>

			<button class="btn-primary" :disabled="isLoading" @tap="handleSubmit">
				{{ isLoading ? '提交中...' : '确认修改' }}
			</button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { safeNavigateBack } from '@/utils/navigation';
import { authApi, clearTokens } from '@/services/apiService';

const statusBarHeight = ref(0);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);

onMounted(() => {
	const systemInfo = uni.getSystemInfoSync();
	statusBarHeight.value = systemInfo.statusBarHeight || 0;
});

const handleBack = () => {
	safeNavigateBack();
};

const handleSubmit = async () => {
	if (!oldPassword.value) {
		uni.showToast({ title: '请输入当前密码', icon: 'none' });
		return;
	}
	if (!newPassword.value) {
		uni.showToast({ title: '请输入新密码', icon: 'none' });
		return;
	}
	if (newPassword.value.length < 6) {
		uni.showToast({ title: '新密码至少6位', icon: 'none' });
		return;
	}
	if (newPassword.value !== confirmPassword.value) {
		uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
		return;
	}
	if (oldPassword.value === newPassword.value) {
		uni.showToast({ title: '新密码不能与当前密码相同', icon: 'none' });
		return;
	}

	isLoading.value = true;
	uni.showLoading({ title: '修改中...' });

	try {
		await authApi.changePassword(oldPassword.value, newPassword.value);
		uni.hideLoading();
		
		uni.showModal({
			title: '修改成功',
			content: '密码已修改，请重新登录',
			showCancel: false,
			success: () => {
				clearTokens();
				uni.reLaunch({ url: '/pages/login/index' });
			}
		});
	} catch (error) {
		uni.hideLoading();
		const errorMsg = error instanceof Error ? error.message : '修改失败';
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
	background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
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
	background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
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
	background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
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
