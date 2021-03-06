import {IUser} from '..';
import {Route} from 'vue-router';
import {reactive, set} from '@vue/composition-api';

interface IUserLoginInfo {
  user?: IUser;
  token?: string;
  // 用于跳转地址
  redirect?: Route;
  // 用于storage中的过期时间
  expire?: number;
  setting?: object;
}
export const storeUserInfo = reactive<IUserLoginInfo>({
  user: undefined,
  token: undefined,
  redirect: undefined,
});

export function initStoreUserInfo() {
  const dataJson = localStorage.getItem(process.env.VUE_APP_APP_NAME + '-user');
  if (!dataJson) {
    storeUserInfo.user = undefined;
    storeUserInfo.token = undefined;
    storeUserInfo.setting = undefined;
  } else {
    const data = JSON.parse(dataJson);
    // 过期策略
    if (new Date().getTime() - data.expire > 0) {
      rmStoreUserInfo();
    } else {
      storeUserInfo.user = data.user;
      storeUserInfo.token = data.token;
      storeUserInfo.setting = data.setting;
    }
  }
}

export function updateStoreUserInfo(data: IUserLoginInfo) {
  set(storeUserInfo, 'user', data.user);
  storeUserInfo.token = data.token;
  if (data.setting) {
    storeUserInfo.setting = data.setting;
  }
  storeUserInfo.expire = new Date().getTime() + 1000 * 60 * 60 * 20; // 过期时间 20h
  const obj = {
    user: data.user,
    token: data.token,
    expire: storeUserInfo.expire,
  };
  localStorage.setItem(process.env.VUE_APP_APP_NAME + '-user', JSON.stringify(obj));
}

export function rmStoreUserInfo() {
  for (const key in storeUserInfo) {
    // @ts-ignore
    delete storeUserInfo[key];
  }
  localStorage.removeItem(process.env.VUE_APP_APP_NAME + '-user');
}
