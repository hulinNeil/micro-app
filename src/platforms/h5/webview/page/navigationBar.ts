import { INavigationBarParams } from '../../service/api/ui';
import { PageFactory } from './page';

const onNavigationBarChange = (data: INavigationBarParams, webviewId: number) => {
  const { backgroundColor, color, titleText, loading } = data;
  const page = PageFactory.getPage(webviewId);
  if (page) {
    backgroundColor && (page.navigationBar.navigationBarBackgroundColor = backgroundColor);
    color && (page.navigationBar.navigationBarTextStyle = color);
    titleText && (page.navigationBar.navigationBarTitleText = titleText);
    if (typeof loading !== 'undefined') {
      page.navigationBar.loading = loading;
    }
  }
};

export default onNavigationBarChange;
