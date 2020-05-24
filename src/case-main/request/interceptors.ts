import Qs from 'qs';
import { CancelTokenSources } from './index';
import axios from 'axios';
import VueRouter from 'vue-router';
import { storeUserInfo, rmStoreUserInfo } from '../store';

export function axiosIntercept(router: VueRouter) {
  axios.interceptors.response.use((res) => {
      // 用于axios取消请求
      if (res.config) {
        const token = res.config.cancelToken;
        if (token) {
          const source = CancelTokenSources.find((source) => source.token === token);
          if (source) {
            CancelTokenSources.splice(CancelTokenSources.indexOf(source), 1);
          }
        }
      } else {
        console.log(res);
      }
      // 返回时直接返回的data
      return res ? res.data : null;
    }, (e) => {
      // 只处理result==2，其他交给catch
      if (e.response && e.response.data && e.response.data.result === 2) {
        rmStoreUserInfo();
        router.push({ name: 'login' });
      } else {
        throw e;
      }
      // console.log(res.data)
      // if(!res || !res.data) return;
      // // 接口错误后的json数据处理
      // if (res.data.result === 0) {
      //   Message.error('请求错误：' + res.data.message);
      //   // throw new Error('请求错误：' + res.data.message);
      // } else if (res.data.result === 2) {
      //
      //   // throw new Error('登录失效');
      // }
    },
  );
  axios.interceptors.request.use((config) => {
    /**
     * 生成一个请求的token并放入请求列表中, 在页面跳转前可以将列表中的所有请求中止避免快速跳转页面引起的大量请求的bug
     */
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    CancelTokenSources.push(source);
    if (!(config.data instanceof FormData)) {
      const data = Qs.parse(config.data);
      data.token = storeUserInfo.token;
      config.data = Qs.stringify(data);
    }
    return config;
  });
}
