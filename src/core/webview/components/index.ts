import Button from './button/index';
import View from './view';
import Text from './text';
import Image from './image';
import Navigator from './navigator';
import Progress from './progress';

const components = [Button, Image, View, Text, Navigator, Progress];

components.forEach((component) => {
  if (component.is) {
    window.customElements.define(component.is, component);
  }
});
