import { ref, Ref, watch } from '@vue/composition-api';
import { isNumber } from '../utils';
import { mapToPinyin } from '../utils/pinyin-map';

function search(row: object, keywords: string, option: Partial<IFilterOption> = {}, path = '') {
  // const excludeId = option.excludeId === undefined ? true : option.excludeId;
  // const excludeProps = option.excludeProps || [];
  const includeProps = option.includeProps || [];
  for (const [prop, col] of Object.entries(row)) {
    const propPath = path === '' ? prop : path + '.' + prop;
    if (
      // includeProps.length > 0 &&
      includeProps.every((includeProp) => !includeProp.match(new RegExp(`^${propPath}`)))
    // todo ???
    // col !== undefined &&
    // col !== null &&
    // (excludeId && propPath.toLowerCase().endsWith('id') ||
    // excludeProps.includes(prop))
    ) {
      continue;
    } else if (typeof col !== 'object' && searchToken(col, keywords)) {
      return true;
    } else if (Array.isArray(col)) {
      for (const item of col) {
        if (typeof item !== 'object') {
          if (searchToken(item, keywords)) {
            return true;
          }
        } else if (search(item, keywords, option, propPath)) {
          return true;
        }
      }
    } else if (typeof col === 'object') {
      if (search(col, keywords, option, propPath)) {
        return true;
      }
    }
  }
  function searchToken(token: string | number, keywords: string) {
    const lower = token.toString().toLowerCase();
    const lowerKeyords = keywords.toLowerCase();
    return lower.includes(lowerKeyords) || toPinyin(lower).includes(lowerKeyords);
  }
}
export function toPinyin(str: string) {
  const pinyinArr: string[] = [];
  for (const letter of str) {
    pinyinArr.push(mapToPinyin(letter) || letter);
  }
  return pinyinArr.join('');
}
interface IFilterOption {
  excludeId?: boolean;
  excludeProps?: string[];
  includeProps?: string[];
  delay?: number;
}
interface SearchOptions {
  excludeId?: boolean;
  excludeProps?: string[];
  includeProps?: string[];
  delay?: number;
  separator?: string;
}
/**
 * 多关键词搜索，中文搜索
 * @param {object[]} data source
 * @param {SearchOptions} opt options
 * @param {boolean} opt.excludeId specified if exclude property 'id', default: false
 * @param {string[]} opt.excludeProps specified which properties won't be searched, support index-path like 'a.b.c'
 * @param {string[]} opt.includeProps specified which properties searched, support index-path like 'a.b.c'
 * @param {number} opt.delay if provided, searching will be delayed by this millisecond(s), default: 300
 * @return {Touple} [keywords, result]
 */
export function useSearch<R extends {}>(data: Ref<R[]>, opt: SearchOptions = {}): [Ref<string>, Ref<R[]>] {
  if (!data.value) { data.value = []; }
  const delay = isNumber(opt.delay) && !Number.isNaN(opt.delay) ? opt.delay : 150;
  const separator = opt.separator || ' ';
  const keywords = ref('');
  const searchFn = (row: R) => {
    for (const keyword of keywords.value.split(separator).filter(Boolean)) {
      if (!search(row, keyword, opt)) {
        return false;
      }
    }
    return true;
  };
  const result: Ref<R[]> = ref(data.value);
  let timer = 0;
  watch(keywords, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      result.value = data.value.filter(searchFn);
    }, delay);
  });
  watch(data, () => {
    result.value = data.value.filter(searchFn);
  });
  return [keywords, result];
}
