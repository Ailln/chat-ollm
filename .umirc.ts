import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  links: [{ rel: 'icon', href: 'robot_icon.png' }],
  title: 'YES! It\'s Chat OLLM',
  fastRefresh: {},
});
