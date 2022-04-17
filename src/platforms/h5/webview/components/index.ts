import App from './app';
import Body from './body';
import PageHead from './header';
import PageRefresh from './refresh';
import AppPage from './page';
import tabBar from './tabBar';

const components = [App, AppPage, PageHead, Body, PageRefresh, tabBar];

components.forEach((component) => {
  if (component.is) {
    window.customElements.define(component.is, component);
  }
});
