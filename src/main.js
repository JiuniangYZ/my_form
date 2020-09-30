import Vue from "vue";
import App from "./App.vue";
import { Button, Row, Col, Input, Popover, Icon, notification } from "ant-design-vue";
Vue.use(notification);
Vue.prototype.$notify = notification;
Vue.use(Button);
Vue.use(Row);
Vue.use(Col);
Vue.use(Input);
Vue.use(Popover);
Vue.use(Icon);
Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
