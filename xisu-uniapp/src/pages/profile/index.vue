<template>
	<view class="profile-page">
		<!-- 头部 -->
		<view class="header">
			<text class="page-title">个人中心</text>
			<view class="notification-btn">
				<text class="iconfont icon-campaign"></text>
			</view>
		</view>

		<scroll-view class="content" scroll-y>
			<!-- 用户卡片 -->
			<view class="profile-card">
				<view class="avatar-wrapper">
					<image class="avatar" :src="user.avatar" mode="aspectFill" />
					<view class="online-dot"></view>
				</view>
				<view class="user-info">
					<text class="user-name">{{ user.name }}</text>
					<view class="user-id">
						<text class="iconfont icon-assignment_ind"></text>
						<text class="id-text">{{ user.id }}</text>
					</view>
					<view class="user-tags">
						<text class="tag tag-blue" v-if="user.college">{{ user.college }}</text>
						<text class="tag tag-purple" v-if="user.major">{{ user.major }}</text>
						<text class="tag tag-green" v-if="user.className">{{ user.className }}</text>
					</view>
				</view>
				<view class="edit-btn">
					<text class="iconfont icon-event_note"></text>
				</view>
			</view>

			<!-- 安全设置 -->
			<view class="section-card">
				<view class="menu-item" @tap="handleMenuItem('修改门户密码')">
					<view class="menu-icon bg-orange">
						<text class="iconfont icon-arrow_forward"></text>
					</view>
					<text class="menu-label">修改门户密码</text>
					<text class="arrow">›</text>
				</view>
				<view class="divider"></view>
				<view class="menu-item" @tap="handleMenuItem('修改知外助手密码')">
					<view class="menu-icon bg-teal">
						<text class="iconfont icon-flight_class"></text>
					</view>
					<text class="menu-label">修改知外助手密码</text>
					<text class="arrow">›</text>
				</view>
			</view>

			<!-- 应用设置 -->
			<view class="section-card">
				<view class="menu-item" @tap="handleMenuItem('设置')">
					<view class="menu-icon bg-gray">
						<text class="iconfont icon-settings"></text>
					</view>
					<text class="menu-label">设置</text>
					<text class="arrow">›</text>
				</view>
				<view class="divider"></view>
				<view class="menu-item" @tap="handleMenuItem('关于我们')">
					<view class="menu-icon bg-indigo">
						<text class="iconfont icon-school"></text>
					</view>
					<text class="menu-label">关于我们</text>
					<view class="version-tag">v2.4.1</view>
					<text class="arrow">›</text>
				</view>
			</view>

			<!-- 退出登录 -->
			<view class="logout-btn" @tap="handleLogout">
				<text class="logout-text">退出登录</text>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-spacer"></view>
		</scroll-view>
		
		<!-- 自定义 TabBar -->
		<TabBar :current="2" />
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserInfo, clearTokens, userApi, saveUserInfo } from '@/services/apiService';
import { PagePath } from '@/types';
import TabBar from '@/components/TabBar/index.vue';

interface UserProfile {
	id: string;
	name: string;
	avatar: string;
	major: string;
	type: string;
	college?: string;
	className?: string;
}

const user = ref<UserProfile>({
	id: '',
	name: '加载中...',
	avatar: '/static/default-avatar.png',
	major: '',
	type: '本科生',
});

const isLoading = ref(true);

// 从本地存储和后端加载用户信息
const loadUserInfo = async () => {
	isLoading.value = true;
	
	// 先从本地存储获取缓存的用户信息
	const cachedUser = getUserInfo<{
		id?: string;
		username?: string;
		realName?: string;
		studentId?: string;
		avatar?: string;
		college?: string;
		major?: string;
		className?: string;
	}>();
	
	if (cachedUser) {
		user.value = {
			id: cachedUser.studentId || cachedUser.id || '',
			name: cachedUser.realName || cachedUser.username || '未知用户',
			avatar: cachedUser.avatar || '/static/default-avatar.png',
			major: cachedUser.major || '',
			type: '本科生',
			college: cachedUser.college,
			className: cachedUser.className,
		};
	}
	
	// 尝试从后端刷新用户信息
	try {
		const freshUser = await userApi.getMe();
		console.log('[Profile] Fresh user data:', JSON.stringify(freshUser));
		if (freshUser) {
			user.value = {
				id: freshUser.studentId || freshUser.id || '',
				name: freshUser.realName || freshUser.username || '未知用户',
				avatar: freshUser.avatar || '/static/default-avatar.png',
				major: freshUser.major || '',
				type: '本科生',
				college: freshUser.college,
				className: freshUser.className,
			};
			console.log('[Profile] User value after update:', JSON.stringify(user.value));
			
			// 同时更新本地存储
			saveUserInfo(freshUser);
		}
	} catch (error) {
		console.log('[Profile] Failed to refresh user info:', error);
	} finally {
		isLoading.value = false;
	}
};

onMounted(() => {
	loadUserInfo();
});

const handleMenuItem = (name: string) => {
	uni.showToast({ title: name, icon: 'none' });
};

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				clearTokens();
				uni.reLaunch({
					url: PagePath.LOGIN
				});
			}
		}
	});
};
</script>

<style lang="scss" scoped>
.profile-page {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: $bg-light;
}

.header {
	position: sticky;
	top: 0;
	z-index: 10;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 48rpx;
	padding-top: calc(var(--status-bar-height) + 48rpx);
	background: rgba(248, 250, 252, 0.9);
	backdrop-filter: blur(20rpx);
}

.page-title {
	font-size: 40rpx;
	font-weight: 700;
	color: $text-primary;
}

.notification-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background-color: #fff;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
	display: flex;
	align-items: center;
	justify-content: center;
	
	.icon {
		font-size: 36rpx;
	}
}

.content {
	flex: 1;
	padding: 0 32rpx;
}

.profile-card {
	display: flex;
	align-items: center;
	background-color: #fff;
	border-radius: 48rpx;
	padding: 40rpx 48rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	border: 2rpx solid rgba(0,0,0,0.04);
}

.avatar-wrapper {
	position: relative;
	margin-right: 40rpx;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, $primary 0%, #60A5FA 100%);
	padding: 4rpx;
	box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.2);
}

.online-dot {
	position: absolute;
	bottom: 8rpx;
	right: 8rpx;
	width: 24rpx;
	height: 24rpx;
	background-color: $success;
	border: 4rpx solid #fff;
	border-radius: 50%;
}

.user-info {
	flex: 1;
}

.user-name {
	font-size: 40rpx;
	font-weight: 700;
	color: $text-primary;
	margin-bottom: 8rpx;
}

.user-id {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	
	.icon {
		font-size: 28rpx;
		margin-right: 8rpx;
		opacity: 0.7;
	}
	
	.id-text {
		font-size: 28rpx;
		color: $text-secondary;
	}
}

.user-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.tag {
	display: inline-block;
	padding: 8rpx 20rpx;
	border-radius: 32rpx;
	font-size: 24rpx;
	font-weight: 500;
	
	&.tag-blue {
		background-color: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}
	
	&.tag-purple {
		background-color: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
	}
	
	&.tag-green {
		background-color: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
}

.edit-btn {
	.icon {
		font-size: 40rpx;
		color: $text-light;
	}
}

.section-card {
	background-color: #fff;
	border-radius: 48rpx;
	overflow: hidden;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	border: 2rpx solid rgba(0,0,0,0.04);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 32rpx;
	
	&:active {
		background-color: rgba(0,0,0,0.02);
	}
}

.menu-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	
	.icon {
		font-size: 36rpx;
	}
	
	&.bg-orange { background-color: rgba(249, 115, 22, 0.1); }
	&.bg-teal { background-color: rgba(20, 184, 166, 0.1); }
	&.bg-gray { background-color: rgba(107, 114, 128, 0.1); }
	&.bg-indigo { background-color: rgba(99, 102, 241, 0.1); }
}

.menu-label {
	flex: 1;
	font-size: 32rpx;
	font-weight: 500;
	color: $text-primary;
}

.version-tag {
	padding: 8rpx 16rpx;
	background-color: rgba(0,0,0,0.04);
	border-radius: 12rpx;
	font-size: 24rpx;
	color: $text-light;
	margin-right: 8rpx;
}

.arrow {
	font-size: 40rpx;
	color: $text-light;
}

.divider {
	height: 2rpx;
	background-color: $border-color;
	margin-left: 136rpx;
}

.logout-btn {
	background-color: rgba(239, 68, 68, 0.05);
	border-radius: 32rpx;
	padding: 32rpx;
	margin-top: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(239, 68, 68, 0.05);
	
	&:active {
		background-color: rgba(239, 68, 68, 0.1);
	}
}

.logout-text {
	display: block;
	text-align: center;
	font-size: 32rpx;
	font-weight: 700;
	color: $danger;
}

.bottom-spacer {
	height: 200rpx;
}
</style>
